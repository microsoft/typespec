package type.union.discriminated.extendsnamespace.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the ExtendsClient type.
 */
public final class ExtendsClientImpl {
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
     * The ExplicitDiscriminatorOperationsImpl object to access its operations.
     */
    private final ExplicitDiscriminatorOperationsImpl explicitDiscriminatorOperations;

    /**
     * Gets the ExplicitDiscriminatorOperationsImpl object to access its operations.
     * 
     * @return the ExplicitDiscriminatorOperationsImpl object.
     */
    public ExplicitDiscriminatorOperationsImpl getExplicitDiscriminatorOperations() {
        return this.explicitDiscriminatorOperations;
    }

    /**
     * The InjectedDiscriminatorOperationsImpl object to access its operations.
     */
    private final InjectedDiscriminatorOperationsImpl injectedDiscriminatorOperations;

    /**
     * Gets the InjectedDiscriminatorOperationsImpl object to access its operations.
     * 
     * @return the InjectedDiscriminatorOperationsImpl object.
     */
    public InjectedDiscriminatorOperationsImpl getInjectedDiscriminatorOperations() {
        return this.injectedDiscriminatorOperations;
    }

    /**
     * The CustomDiscriminatorOperationsImpl object to access its operations.
     */
    private final CustomDiscriminatorOperationsImpl customDiscriminatorOperations;

    /**
     * Gets the CustomDiscriminatorOperationsImpl object to access its operations.
     * 
     * @return the CustomDiscriminatorOperationsImpl object.
     */
    public CustomDiscriminatorOperationsImpl getCustomDiscriminatorOperations() {
        return this.customDiscriminatorOperations;
    }

    /**
     * The EnumDiscriminatorOperationsImpl object to access its operations.
     */
    private final EnumDiscriminatorOperationsImpl enumDiscriminatorOperations;

    /**
     * Gets the EnumDiscriminatorOperationsImpl object to access its operations.
     * 
     * @return the EnumDiscriminatorOperationsImpl object.
     */
    public EnumDiscriminatorOperationsImpl getEnumDiscriminatorOperations() {
        return this.enumDiscriminatorOperations;
    }

    /**
     * The RecursivesImpl object to access its operations.
     */
    private final RecursivesImpl recursives;

    /**
     * Gets the RecursivesImpl object to access its operations.
     * 
     * @return the RecursivesImpl object.
     */
    public RecursivesImpl getRecursives() {
        return this.recursives;
    }

    /**
     * Initializes an instance of ExtendsClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ExtendsClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.explicitDiscriminatorOperations = new ExplicitDiscriminatorOperationsImpl(this);
        this.injectedDiscriminatorOperations = new InjectedDiscriminatorOperationsImpl(this);
        this.customDiscriminatorOperations = new CustomDiscriminatorOperationsImpl(this);
        this.enumDiscriminatorOperations = new EnumDiscriminatorOperationsImpl(this);
        this.recursives = new RecursivesImpl(this);
    }
}
