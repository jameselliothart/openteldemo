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
logger = logging.getLogger('processor')

# Configure OpenTelemetry with service name
resource = Resource(attributes={"service.name": "processor"})
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer = trace.get_tracer('processor-tracer')
otlp_exporter = OTLPSpanExporter(endpoint='http://jaeger:4318/v1/traces')
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

def process(client):
    try:
        # Subscribe to the 'internal' topic
        logger.info('Subscribing to internal topic')
        for message in client.subscribe(topic="internal", timeout=5000):
            logger.info(f'Processing message data {message.get_data()}')
            try:
                # Extract CorrelationId for trace context
                data = json.loads(message.get_data())
                correlation_id = data.get('CorrelationId')
                if not correlation_id:
                    logger.warning('No CorrelationId in message')
                    with tracer.start_as_current_span('process-message') as span:
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
                with tracer.start_as_current_span('process-message', context=context) as span:
                    span.set_attribute('message.id', data.get('messageId', 'unknown'))

                    # Process the message
                    logger.info(f'Processing message {data.get("messageId")}')
                    data['processed'] = True

                    # Update CorrelationId with current span's traceId and spanId
                    span_context = span.get_span_context()
                    data['CorrelationId'] = f'{format(span_context.trace_id, "032x")}-{format(span_context.span_id, "016x")}'

                    # Publish to 'external' topic
                    client.publish('external', json.dumps(data))
                    logger.info(f'Published to external: {data.get("messageId")}')
                    span.add_event('Message published to external topic')

            except json.JSONDecodeError as e:
                logger.error(f'Invalid JSON: {e}')
                with tracer.start_as_current_span('process-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')
            except AMPS.AMPSException as e:
                logger.error(f'AMPS error: {e}')
                with tracer.start_as_current_span('process-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')
            except Exception as e:
                logger.error(f'Unexpected error: {e}')
                with tracer.start_as_current_span('process-message') as span:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.set_attribute('message.id', data.get('messageId', 'unknown') if 'data' in locals() else 'unknown')

    except AMPS.AMPSException as e:
        logger.error(f'AMPS subscription error: {e}')
    except Exception as e:
        logger.error(f'Unexpected error in subscription: {e}')

def main():
    client = AMPS.Client('processor-client')
    try:
        logger.info('Connecting to AMPS')
        client.connect('tcp://amps:9008/amps/json')
        client.logon()
        logger.info('Connected to AMPS')
        process(client)
    except AMPS.AMPSException as e:
        logger.error(f'AMPS connection error: {e}')
    finally:
        client.close()
        logger.info('Disconnected from AMPS')

if __name__ == '__main__':
    main()