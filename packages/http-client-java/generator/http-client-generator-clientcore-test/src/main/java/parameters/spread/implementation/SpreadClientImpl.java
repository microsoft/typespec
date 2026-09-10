package parameters.spread.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the SpreadClient type.
 */
public final class SpreadClientImpl {

    /**
     * The AliasImpl object to access its operations.
     */
    private final AliasImpl alias;

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
     * The ModelsImpl object to access its operations.
     */
    private final ModelsImpl models;

    /**
     * Initializes an instance of SpreadClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public SpreadClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.models = new ModelsImpl(this);
        this.alias = new AliasImpl(this);
    }

    /**
     * Gets the AliasImpl object to access its operations.
     *
     * @return the AliasImpl object.
     */
    public AliasImpl getAlias() {
        return this.alias;
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
     * Gets the ModelsImpl object to access its operations.
     *
     * @return the ModelsImpl object.
     */
    public ModelsImpl getModels() {
        return this.models;
    }
}
