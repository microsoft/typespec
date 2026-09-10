package type.scalar.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the ScalarClient type.
 */
public final class ScalarClientImpl {

    /**
     * The BooleanOperationsImpl object to access its operations.
     */
    private final BooleanOperationsImpl booleanOperations;

    /**
     * The Decimal128TypesImpl object to access its operations.
     */
    private final Decimal128TypesImpl decimal128Types;

    /**
     * The Decimal128VerifiesImpl object to access its operations.
     */
    private final Decimal128VerifiesImpl decimal128Verifies;

    /**
     * The DecimalTypesImpl object to access its operations.
     */
    private final DecimalTypesImpl decimalTypes;

    /**
     * The DecimalVerifiesImpl object to access its operations.
     */
    private final DecimalVerifiesImpl decimalVerifies;

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
     * The StringOperationsImpl object to access its operations.
     */
    private final StringOperationsImpl stringOperations;

    /**
     * The UnknownsImpl object to access its operations.
     */
    private final UnknownsImpl unknowns;

    /**
     * Initializes an instance of ScalarClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ScalarClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.stringOperations = new StringOperationsImpl(this);
        this.booleanOperations = new BooleanOperationsImpl(this);
        this.unknowns = new UnknownsImpl(this);
        this.decimalTypes = new DecimalTypesImpl(this);
        this.decimal128Types = new Decimal128TypesImpl(this);
        this.decimalVerifies = new DecimalVerifiesImpl(this);
        this.decimal128Verifies = new Decimal128VerifiesImpl(this);
    }

    /**
     * Gets the BooleanOperationsImpl object to access its operations.
     *
     * @return the BooleanOperationsImpl object.
     */
    public BooleanOperationsImpl getBooleanOperations() {
        return this.booleanOperations;
    }

    /**
     * Gets the Decimal128TypesImpl object to access its operations.
     *
     * @return the Decimal128TypesImpl object.
     */
    public Decimal128TypesImpl getDecimal128Types() {
        return this.decimal128Types;
    }

    /**
     * Gets the Decimal128VerifiesImpl object to access its operations.
     *
     * @return the Decimal128VerifiesImpl object.
     */
    public Decimal128VerifiesImpl getDecimal128Verifies() {
        return this.decimal128Verifies;
    }

    /**
     * Gets the DecimalTypesImpl object to access its operations.
     *
     * @return the DecimalTypesImpl object.
     */
    public DecimalTypesImpl getDecimalTypes() {
        return this.decimalTypes;
    }

    /**
     * Gets the DecimalVerifiesImpl object to access its operations.
     *
     * @return the DecimalVerifiesImpl object.
     */
    public DecimalVerifiesImpl getDecimalVerifies() {
        return this.decimalVerifies;
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
     * Gets the StringOperationsImpl object to access its operations.
     *
     * @return the StringOperationsImpl object.
     */
    public StringOperationsImpl getStringOperations() {
        return this.stringOperations;
    }

    /**
     * Gets the UnknownsImpl object to access its operations.
     *
     * @return the UnknownsImpl object.
     */
    public UnknownsImpl getUnknowns() {
        return this.unknowns;
    }
}
