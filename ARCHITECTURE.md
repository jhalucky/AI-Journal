# Architecture Notes

## 1. How would you scale this to 100k users?
- Split the system into independently deployable services: frontend, API layer, journal storage service, and LLM analysis worker.
- Move SQLite to a managed relational database such as PostgreSQL because SQLite is excellent for local development but not for multi-instance write-heavy production workloads.
- Put the API behind a load balancer and run multiple stateless Node.js instances.
- Use a queue for analysis jobs so journal writes stay fast while LLM processing happens asynchronously when traffic spikes.
- Add read replicas or dedicated analytics storage for insight queries if reporting volume becomes heavy.
- Store cached insight aggregates in Redis so dashboards do not repeatedly scan raw journal rows.
- Add observability: request tracing, structured logs, queue depth metrics, database latency monitoring, and alerting.

## 2. How would you reduce LLM cost?
- Cache analysis results using normalized journal text as the key, which removes duplicate calls for repeated prompts.
- Use a smaller model for default sentiment extraction and reserve larger models for complex cases or admin review workflows.
- Run lightweight local heuristics first to classify obvious emotions, then only call the LLM when confidence is low.
- Batch offline enrichment jobs instead of analyzing every request synchronously when immediate feedback is not required.
- Limit output format to strict JSON with small summaries so prompt and completion tokens stay short.
- Deduplicate near-identical entries using hashes or embeddings before sending them to the model.

## 3. How would you cache repeated analysis?
- Keep the current in-memory cache for local development because it is simple and fast.
- In production, move the cache to Redis so every API instance shares the same analysis results.
- Normalize the text before hashing: trim whitespace, lowercase it, and collapse repeated spaces to improve hit rate.
- Store the parsed JSON analysis result and a TTL, for example 30 minutes to 24 hours depending on how stable the model output should be.
- Add cache metrics such as hit rate, miss rate, and eviction count to verify the cache is actually saving money.

## 4. How would you protect sensitive journal data?
- Encrypt data in transit with HTTPS and encrypt database storage at rest.
- Minimize PII: store a user identifier, but avoid unnecessary personal profile fields in the journal table.
- Encrypt especially sensitive fields such as journal text with application-level encryption if threat requirements are high.
- Use strict access control so users can only fetch their own entries; add authentication and authorization middleware before production use.
- Keep API keys in environment variables or a secrets manager, never in source control.
- Add audit logging for access to journal records and set retention policies for logs and journal content.
- Redact or anonymize journal text before sending it to third-party LLM providers when product requirements allow it.
- Define data retention and deletion workflows so users can remove their journals permanently.
