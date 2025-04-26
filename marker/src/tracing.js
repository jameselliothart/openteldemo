import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Initialize OpenTelemetry tracer
const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'marker',
  }),
});

// Configure OTLP exporter to send traces to Jaeger via HTTP
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Jaeger OTLP HTTP endpoint
});

// Add BatchSpanProcessor to handle trace export
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Register the provider
provider.register();

export const tracer = provider.getTracer('marker');