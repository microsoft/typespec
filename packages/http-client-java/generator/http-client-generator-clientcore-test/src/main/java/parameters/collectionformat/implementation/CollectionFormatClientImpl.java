package parameters.collectionformat.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the CollectionFormatClient type.
 */
public final class CollectionFormatClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The HeadersImpl object to access its operations.
     */
    private final HeadersImpl headers;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The QueriesImpl object to access its operations.
     */
    private final QueriesImpl queries;

    /**
     * Initializes an instance of CollectionFormatClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public CollectionFormatClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.queries = new QueriesImpl(this);
        this.headers = new HeadersImpl(this);
    }

    /**
     * Gets Service host.
     *
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Gets the HeadersImpl object to access its operations.
     *
     * @return the HeadersImpl object.
     */
    public HeadersImpl getHeaders() {
        return this.headers;
    }

    /**
     * Gets The HTTP pipeline to send requests through.
     *
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * Gets The instance of instrumentation to report telemetry.
     *
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Gets the QueriesImpl object to access its operations.
     *
     * @return the QueriesImpl object.
     */
    public QueriesImpl getQueries() {
        return this.queries;
    }
}
