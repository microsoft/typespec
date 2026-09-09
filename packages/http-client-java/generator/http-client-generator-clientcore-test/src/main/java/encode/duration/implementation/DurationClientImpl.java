package encode.duration.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the DurationClient type.
 */
public final class DurationClientImpl {

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
     * The LossiesImpl object to access its operations.
     */
    private final LossiesImpl lossies;

    /**
     * The PropertiesImpl object to access its operations.
     */
    private final PropertiesImpl properties;

    /**
     * The QueriesImpl object to access its operations.
     */
    private final QueriesImpl queries;

    /**
     * Initializes an instance of DurationClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public DurationClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.queries = new QueriesImpl(this);
        this.properties = new PropertiesImpl(this);
        this.headers = new HeadersImpl(this);
        this.lossies = new LossiesImpl(this);
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
     * Gets the LossiesImpl object to access its operations.
     *
     * @return the LossiesImpl object.
     */
    public LossiesImpl getLossies() {
        return this.lossies;
    }

    /**
     * Gets the PropertiesImpl object to access its operations.
     *
     * @return the PropertiesImpl object.
     */
    public PropertiesImpl getProperties() {
        return this.properties;
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
