import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initializeTracer() {
  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'react-web-app',
    }),
  });

  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:8080/v1/traces', // Points to Nginx proxy
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  const tracer = provider.getTracer('marker-tracer');
  return tracer;
}