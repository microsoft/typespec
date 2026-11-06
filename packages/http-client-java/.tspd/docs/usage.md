### Prerequisite

Install a supported [Node.js](https://nodejs.org/) LTS. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi) (Verify by running `mvn --version`). Maven is needed to build the generated client, but not to run the emitter.

### Experimental server-sent events

For supported Azure v1 data-plane services, the emitter can generate native immutable Java wrappers for named JSON events in an `SSEStream`. The generated base wrapper name comes from the stream union, with an `Events` suffix converted to `Event`.

An event with an authored `@data` envelope uses that envelope's client-facing model name for its generated wrapper. Java `@clientName` overrides are honored, including names marked with `exact(...)`. The authored envelope itself is not generated as a second hierarchy; the generated wrapper contains the actual event payload as its `value`.

Direct payload events and anonymous envelopes continue to derive wrapper names from the wire event name. A payload model's name is not used as an envelope name.

Each event wrapper name must be unique within one stream union. Do not reuse one named envelope for multiple wire events or give distinct envelopes the same Java client name in the same union. Reusing an envelope in separate stream unions remains supported.
