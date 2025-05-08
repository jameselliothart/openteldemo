# AMPS Messaging with OpenTelemetry Tracing

This repo showcases a distributed messaging system using AMPS with OpenTelemetry tracing to monitor and debug message flows across services. The system consists of three services (marker, processor, persister) communicating via AMPS topics (internal, external) and exporting traces to Jaeger for visualization.

For a quick walkthrough see [here](demo.md).

## System Overview

The demo simulates a message processing pipeline:

- marker: A React web application that publishes messages to the `internal` topic via AMPS. Messages include a CorrelationId for trace propagation.
- processor: A Python service that subscribes to `internal`, processes messages (adds processed=true), and publishes to the `external` topic, updating the CorrelationId with its trace context.
- persister: A Python service that subscribes to `external` and appends messages as JSON strings to a local file, continuing the trace.
- AMPS: The messaging server handling topic-based communication.
- Jaeger: The tracing backend receiving OpenTelemetry traces from the listed services

### Architecture

```
[marker (React)] --> [AMPS: internal] --> [processor (Python)] --> [AMPS: external] --> [persister (Python)] --> [database (file: messages.jsonl)]
```

### Trace Hierarchy

In Jaeger, traces show:

- react-web-app: publish-message (marker)
  - processor: process-message (child)
    - persister: persist-message (child)

## The Case for OpenTelemetry

Implementing OpenTelemetry in a distributed messaging architecture like this AMPS-based system provides significant benefits for observability, debugging, and performance optimization.

### Situation

The AMPS messaging system (marker -> processor -> persister) processes messages reliably, but lacks visibility into the end-to-end message flow. Developers rely on fragmented application logs to troubleshoot issues, such as:

- Messages not reaching persister (e.g., lost in processor or AMPS)
- Delays in processing (e.g., slow transformations in processor)
- Errors in AMPS subscriptions or file writes

There's no unified view to track a message's journey across services, identify failure points, or measure latencies. For example, if persister does not write a message to the database, it's unclear whether marker failed to publish, processor dropped the message, or persister encountered an error. This opacity leads to prolonged debugging, user dissatisfaction, and compliance risks due to untraceable data flows.

### Task

Equip the system with observability to:

- Track messages end-to-end across marker, processor, and persister
- Identify where failures or bottlenecks occur across distributed components
- Pinpoint root causes of failures (e.g., AMPS topic issues, parsing errors, file write failures) within minutes
- Measure and optimize latency for each service (e.g., publishing, processing, persisting)
- Improve developer productivity and user satisfaction by reducing debugging time
- Ensure traceability for auditing and compliance

### Action

Implement OpenTelemetry tracing to enhance observability across the distributed system, addressing the unique challenges of AMPS and diverse service technologies:

- Manual Instrumentation: Since AMPS does not natively support OpenTelemetry, each service must be manually instrumented to generate and propagate trace context
  - Add OpenTelemetry SDKs for JavaScript (in the React-based marker) and Python (in processor and persister)
  - Create spans for key operations (e.g., publishing, processing, persisting), and embedding trace context (traceId, spanId) in message payloads via a custom CorrelationId
  - Manual instrumentation ensured tracing across client-facing (marker) and back-end (processor, persister) services, despite AMPS lacking built-in tracing features like those in other messaging systems (e.g., Kafka, RabbitMQ)
- Cross-Technology Tracing: OpenTelemetry's language-agnostic framework enabled consistent instrumentation across different technologies (React JavaScript for marker, Python for processor and persister) and stack locations (client-facing UI, back-end processing, and storage). This ensured a unified trace view regardless of service implementation.
- Trace Context Propagation: trace context is propagated through AMPS topics by including CorrelationId in message payloads, linking spans across services to maintain parent-child relationships (e.g., publish-message -> process-message -> persist-message). This manual propagation compensated for AMPS's lack of native trace header support.
- Collector Integration: A suitable trace collector was required to aggregate and visualize traces. The demo used Jaeger as an example, but OpenTelemetry's vendor-neutral protocol (OTLP) supports other collectors (e.g., Zipkin, AWS X-Ray). Traces were exported via HTTP for marker to handle browser-based exports and direct OTLP endpoints for processor and persister.
- Deployment: OpenTelemetry was integrated without altering AMPS's core messaging functionality, deploying tracing alongside existing services

While AMPS's lack of native OpenTelemetry support required manual effort and resulted in less automated tracing compared to other messaging systems, the implementation achieved robust observability across the heterogeneous architecture.

### Result

After implementing OpenTelemetry, the system achieved full observability, transforming its operational and business outcomes:

- End-to-End Visibility: Jaeger displays the complete message flow (publish-message -> process-message -> persist-message) with parent-child relationships, enabling developers to track a message from marker to database in seconds. For example, a missing message is traced to a persist-message span showing a file I/O error.
- Rapid Issue Resolution: Debugging time dropped from hours to minutes. Issues like AMPS subscription failures or JSON parsing errors are pinpointed in Jaeger (e.g., process-message span with Invalid JSON error).
- Performance Optimization: Span timings reveal system bottlenecks and identify points of improvement.
- Customer Satisfaction: Reliable message delivery (verified in database) and quick issue resolution minimized disruptions (e.g., no lost marks), improving user trust.
- Compliance and Auditing: Traces provide an audit trail, showing each message's journey with timestamps and CorrelationId.
- Developer Productivity: Eliminating manual log correlation freed developers to focus on features, increasing delivery speed.

The system now supports rapid debugging, performance tuning, and compliance, making it production-ready and scalable, all while maintaining the original AMPS messaging functionality.
