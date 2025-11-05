package payload.contentnegotiation.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the ContentNegotiationClient type.
 */
public final class ContentNegotiationClientImpl {

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
     * The SameBodiesImpl object to access its operations.
     */
    private final SameBodiesImpl sameBodies;

    /**
     * Gets the SameBodiesImpl object to access its operations.
     *
     * @return the SameBodiesImpl object.
     */
    public SameBodiesImpl getSameBodies() {
        return this.sameBodies;
    }

    /**
     * The DifferentBodiesImpl object to access its operations.
     */
    private final DifferentBodiesImpl differentBodies;

    /**
     * Gets the DifferentBodiesImpl object to access its operations.
     *
     * @return the DifferentBodiesImpl object.
     */
    public DifferentBodiesImpl getDifferentBodies() {
        return this.differentBodies;
    }

    /**
     * Initializes an instance of ContentNegotiationClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ContentNegotiationClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.sameBodies = new SameBodiesImpl(this);
        this.differentBodies = new DifferentBodiesImpl(this);
    }
}
