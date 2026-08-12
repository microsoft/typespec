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
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * The UnnamedsImpl object to access its operations.
     */
    private final UnnamedsImpl unnameds;

    /**
     * Gets the UnnamedsImpl object to access its operations.
     * 
     * @return the UnnamedsImpl object.
     */
    public UnnamedsImpl getUnnameds() {
        return this.unnameds;
    }

    /**
     * The NamedsImpl object to access its operations.
     */
    private final NamedsImpl nameds;

    /**
     * Gets the NamedsImpl object to access its operations.
     * 
     * @return the NamedsImpl object.
     */
    public NamedsImpl getNameds() {
        return this.nameds;
    }

    /**
     * The RetrievesImpl object to access its operations.
     */
    private final RetrievesImpl retrieves;

    /**
     * Gets the RetrievesImpl object to access its operations.
     * 
     * @return the RetrievesImpl object.
     */
    public RetrievesImpl getRetrieves() {
        return this.retrieves;
    }

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
}
