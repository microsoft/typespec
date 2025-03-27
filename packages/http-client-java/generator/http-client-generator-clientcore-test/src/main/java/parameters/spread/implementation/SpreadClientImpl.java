package parameters.spread.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the SpreadClient type.
 */
public final class SpreadClientImpl {
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
     * The ModelsImpl object to access its operations.
     */
    private final ModelsImpl models;

    /**
     * Gets the ModelsImpl object to access its operations.
     * 
     * @return the ModelsImpl object.
     */
    public ModelsImpl getModels() {
        return this.models;
    }

    /**
     * The AliasImpl object to access its operations.
     */
    private final AliasImpl alias;

    /**
     * Gets the AliasImpl object to access its operations.
     * 
     * @return the AliasImpl object.
     */
    public AliasImpl getAlias() {
        return this.alias;
    }

    /**
     * Initializes an instance of SpreadClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public SpreadClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.models = new ModelsImpl(this);
        this.alias = new AliasImpl(this);
    }
}
