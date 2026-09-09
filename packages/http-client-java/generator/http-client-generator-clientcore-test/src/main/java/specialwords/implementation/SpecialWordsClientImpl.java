package specialwords.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the SpecialWordsClient type.
 */
public final class SpecialWordsClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The ExtensibleStringsImpl object to access its operations.
     */
    private final ExtensibleStringsImpl extensibleStrings;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The ModelPropertiesImpl object to access its operations.
     */
    private final ModelPropertiesImpl modelProperties;

    /**
     * The ModelsImpl object to access its operations.
     */
    private final ModelsImpl models;

    /**
     * The OperationsImpl object to access its operations.
     */
    private final OperationsImpl operations;

    /**
     * The ParametersImpl object to access its operations.
     */
    private final ParametersImpl parameters;

    /**
     * The ReservedOperationBodyParamsImpl object to access its operations.
     */
    private final ReservedOperationBodyParamsImpl reservedOperationBodyParams;

    /**
     * Initializes an instance of SpecialWordsClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public SpecialWordsClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.models = new ModelsImpl(this);
        this.modelProperties = new ModelPropertiesImpl(this);
        this.reservedOperationBodyParams = new ReservedOperationBodyParamsImpl(this);
        this.extensibleStrings = new ExtensibleStringsImpl(this);
        this.operations = new OperationsImpl(this);
        this.parameters = new ParametersImpl(this);
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
     * Gets the ExtensibleStringsImpl object to access its operations.
     *
     * @return the ExtensibleStringsImpl object.
     */
    public ExtensibleStringsImpl getExtensibleStrings() {
        return this.extensibleStrings;
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
     * Gets the ModelPropertiesImpl object to access its operations.
     *
     * @return the ModelPropertiesImpl object.
     */
    public ModelPropertiesImpl getModelProperties() {
        return this.modelProperties;
    }

    /**
     * Gets the ModelsImpl object to access its operations.
     *
     * @return the ModelsImpl object.
     */
    public ModelsImpl getModels() {
        return this.models;
    }

    /**
     * Gets the OperationsImpl object to access its operations.
     *
     * @return the OperationsImpl object.
     */
    public OperationsImpl getOperations() {
        return this.operations;
    }

    /**
     * Gets the ParametersImpl object to access its operations.
     *
     * @return the ParametersImpl object.
     */
    public ParametersImpl getParameters() {
        return this.parameters;
    }

    /**
     * Gets the ReservedOperationBodyParamsImpl object to access its operations.
     *
     * @return the ReservedOperationBodyParamsImpl object.
     */
    public ReservedOperationBodyParamsImpl getReservedOperationBodyParams() {
        return this.reservedOperationBodyParams;
    }
}
