package specialwords.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the SpecialWordsClient type.
 */
public final class SpecialWordsClientImpl {
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
     * The ModelPropertiesImpl object to access its operations.
     */
    private final ModelPropertiesImpl modelProperties;

    /**
     * Gets the ModelPropertiesImpl object to access its operations.
     * 
     * @return the ModelPropertiesImpl object.
     */
    public ModelPropertiesImpl getModelProperties() {
        return this.modelProperties;
    }

    /**
     * The OperationsImpl object to access its operations.
     */
    private final OperationsImpl operations;

    /**
     * Gets the OperationsImpl object to access its operations.
     * 
     * @return the OperationsImpl object.
     */
    public OperationsImpl getOperations() {
        return this.operations;
    }

    /**
     * The ParametersImpl object to access its operations.
     */
    private final ParametersImpl parameters;

    /**
     * Gets the ParametersImpl object to access its operations.
     * 
     * @return the ParametersImpl object.
     */
    public ParametersImpl getParameters() {
        return this.parameters;
    }

    /**
     * Initializes an instance of SpecialWordsClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public SpecialWordsClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.models = new ModelsImpl(this);
        this.modelProperties = new ModelPropertiesImpl(this);
        this.operations = new OperationsImpl(this);
        this.parameters = new ParametersImpl(this);
    }
}
