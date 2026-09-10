package parameters.basic.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the BasicClient type.
 */
public final class BasicClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The ExplicitBodiesImpl object to access its operations.
     */
    private final ExplicitBodiesImpl explicitBodies;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The ImplicitBodiesImpl object to access its operations.
     */
    private final ImplicitBodiesImpl implicitBodies;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BasicClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public BasicClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.explicitBodies = new ExplicitBodiesImpl(this);
        this.implicitBodies = new ImplicitBodiesImpl(this);
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
     * Gets the ExplicitBodiesImpl object to access its operations.
     *
     * @return the ExplicitBodiesImpl object.
     */
    public ExplicitBodiesImpl getExplicitBodies() {
        return this.explicitBodies;
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
     * Gets the ImplicitBodiesImpl object to access its operations.
     *
     * @return the ImplicitBodiesImpl object.
     */
    public ImplicitBodiesImpl getImplicitBodies() {
        return this.implicitBodies;
    }

    /**
     * Gets The instance of instrumentation to report telemetry.
     *
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }
}
