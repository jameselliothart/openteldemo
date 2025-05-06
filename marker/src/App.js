import React, { useEffect, useState } from 'react';
import { initializeTracer } from './tracing';
import { v4 as uuidv4 } from 'uuid';
import { Client } from './amps';

function App() {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('Disconnected');

  // Initialize AMPS client
  useEffect(() => {
    if (!Client) {
      console.error('AMPS Client not available');
      setStatus('AMPS Client not available');
      return;
    }

    (async () => {
      const ampsClient = new Client('marker-client');
      try {
        await ampsClient.connect('ws://localhost:9007/amps/json');
        console.log('AMPS client connected');
        setClient(ampsClient);
        setStatus('Connected to AMPS');
      } catch (err) {
        console.error('AMPS connection error:', err, 'Details:', JSON.stringify(err));
        setStatus(`Connection failed: ${err.message}`);
      }
    })();

    return () => {
      if (client) {
        console.log('Disconnecting AMPS client');
        client.disconnect();
      }
    };
  }, []);

  // Publish message to AMPS with tracing
  const handlePublish = () => {
    if (!client) {
      setStatus('Not connected to AMPS');
      return;
    }

    // Start a new span for the publish action
    const tracer = initializeTracer();
    const span = tracer.startSpan('publish-message');
    const messageId = uuidv4();
    const traceContext = span.spanContext();
    const message = {
      data: 'some data',
      messageId,
      CorrelationId: `${traceContext.traceId}-${traceContext.spanId}`, // Embed CorrelationId in payload
    };

    // Publish message to 'internal' topic
    try {
      client.publish('internal', JSON.stringify(message));
      console.log('Message published:', message);
      span.setAttribute('message.id', messageId);
      span.addEvent('Message published to internal topic');
      span.end();
      setStatus(`Published message ${messageId}`);
    } catch (err) {
      console.error('Publish error:', err);
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message });
      span.end();
      setStatus(`Publish failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Marker Client</h1>
      <p>Status: {status}</p>
      <button onClick={handlePublish} disabled={!client}>
        Publish
      </button>
    </div>
  );
}

export default App;