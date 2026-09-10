package streaming.sse.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the SseClient type.
 */
public final class SseClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The NamedsImpl object to access its operations.
     */
    private final NamedsImpl nameds;

    /**
     * The RetrievesImpl object to access its operations.
     */
    private final RetrievesImpl retrieves;

    /**
     * The UnnamedsImpl object to access its operations.
     */
    private final UnnamedsImpl unnameds;

    /**
     * Initializes an instance of SseClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public SseClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.unnameds = new UnnamedsImpl(this);
        this.nameds = new NamedsImpl(this);
        this.retrieves = new RetrievesImpl(this);
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
     * Gets the NamedsImpl object to access its operations.
     *
     * @return the NamedsImpl object.
     */
    public NamedsImpl getNameds() {
        return this.nameds;
    }

    /**
     * Gets the RetrievesImpl object to access its operations.
     *
     * @return the RetrievesImpl object.
     */
    public RetrievesImpl getRetrieves() {
        return this.retrieves;
    }

    /**
     * Gets the UnnamedsImpl object to access its operations.
     *
     * @return the UnnamedsImpl object.
     */
    public UnnamedsImpl getUnnameds() {
        return this.unnameds;
    }
}
