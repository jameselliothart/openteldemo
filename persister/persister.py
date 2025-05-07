import json
import logging
import AMPS
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('persister')

# Configure OpenTelemetry with service name
resource = Resource(attributes={"service.name": "persister"})
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer = trace.get_tracer('persister-tracer')
otlp_exporter = OTLPSpanExporter(endpoint='http://jaeger:4318/v1/traces')
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

def persist(client):
    output_file = '/app/messages.jsonl'
    try:
        # Subscribe to the 'external' topic
        logger.info('Subscribing to external topic')
        for message in client.subscribe(topic='external', timeout=5000):
            logger.info(f'Persisting message data {message.get_data()}')
            try:
                # Parse message
                data = json.loads(message.get_data())
                correlation_id = data.get('CorrelationId')
                if not correlation_id:
                    logger.warning('No CorrelationId in message')
                    with tracer.start_as_current_span('persist-message') as span:
                        span.set_attribute('error', 'Missing CorrelationId')
                        span.set_attribute('message.id', data.get('messageId', 'unknown'))
                        continue

                # Extract trace context from CorrelationId (traceId-spanId)
                trace_id, parent_span_id = correlation_id.split('-')
                carrier = {
                    'traceparent': f'00-{trace_id}-{parent_span_id}-01'  # W3C traceparent format
                }
                context = TraceContextTextMapPropagator().extract(carrier=carrier)

                # Start span with extracted context as parent
                with tracer.start_as_current_span('persist-message', context=context) as span:
                    span.set_attribute('message.id', data.get('messageId', 'unknown'))

                    # Append message to file
                    logger.info(f'Persisting message {data.get("messageId")}')
                    with open(output_file, 'a') as f:
                        f.write(json.dumps(data) + '\n')
                    logger.info(f'Persisted message {data.get("messageId")} to {output_file}')
                    span.add_event('Message persisted to file')

            except json.JSONDecodeError as e:
                logger.error(f'Invalid JSON: {e}')
                with tracer.start_as_current_span('persist-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')
            except IOError as e:
                logger.error(f'File write error: {e}')
                with tracer.start_as_current_span('persist-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')
            except AMPS.AMPSException as e:
                logger.error(f'AMPS error: {e}')
                with tracer.start_as_current_span('persist-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')
            except Exception as e:
                logger.error(f'Unexpected error: {e}')
                with tracer.start_as_current_span('persist-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')

    except AMPS.AMPSException as e:
        logger.error(f'AMPS subscription error: {e}')
    except Exception as e:
        logger.error(f'Unexpected error in subscription: {e}')

def main():
    client = AMPS.Client('persister-client')
    try:
        logger.info('Connecting to AMPS')
        client.connect('tcp://amps:9008/amps/json')
        client.logon()
        logger.info('Connected to AMPS')
        persist(client)
    except AMPS.AMPSException as e:
        logger.error(f'AMPS connection error: {e}')
    finally:
        client.close()
        logger.info('Disconnected from AMPS')

if __name__ == '__main__':
    main()