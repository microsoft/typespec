package type.property.optional.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the OptionalClient type.
 */
public final class OptionalClientImpl {

    /**
     * The BooleanLiteralsImpl object to access its operations.
     */
    private final BooleanLiteralsImpl booleanLiterals;

    /**
     * The BytesImpl object to access its operations.
     */
    private final BytesImpl bytes;

    /**
     * The CollectionsBytesImpl object to access its operations.
     */
    private final CollectionsBytesImpl collectionsBytes;

    /**
     * The CollectionsModelsImpl object to access its operations.
     */
    private final CollectionsModelsImpl collectionsModels;

    /**
     * The DatetimeOperationsImpl object to access its operations.
     */
    private final DatetimeOperationsImpl datetimeOperations;

    /**
     * The DurationOperationsImpl object to access its operations.
     */
    private final DurationOperationsImpl durationOperations;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The FloatLiteralsImpl object to access its operations.
     */
    private final FloatLiteralsImpl floatLiterals;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The IntLiteralsImpl object to access its operations.
     */
    private final IntLiteralsImpl intLiterals;

    /**
     * The PlainDatesImpl object to access its operations.
     */
    private final PlainDatesImpl plainDates;

    /**
     * The PlainTimesImpl object to access its operations.
     */
    private final PlainTimesImpl plainTimes;

    /**
     * The RequiredAndOptionalsImpl object to access its operations.
     */
    private final RequiredAndOptionalsImpl requiredAndOptionals;

    /**
     * The StringLiteralsImpl object to access its operations.
     */
    private final StringLiteralsImpl stringLiterals;

    /**
     * The StringOperationsImpl object to access its operations.
     */
    private final StringOperationsImpl stringOperations;

    /**
     * The UnionFloatLiteralsImpl object to access its operations.
     */
    private final UnionFloatLiteralsImpl unionFloatLiterals;

    /**
     * The UnionIntLiteralsImpl object to access its operations.
     */
    private final UnionIntLiteralsImpl unionIntLiterals;

    /**
     * The UnionStringLiteralsImpl object to access its operations.
     */
    private final UnionStringLiteralsImpl unionStringLiterals;

    /**
     * Initializes an instance of OptionalClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public OptionalClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.stringOperations = new StringOperationsImpl(this);
        this.bytes = new BytesImpl(this);
        this.datetimeOperations = new DatetimeOperationsImpl(this);
        this.durationOperations = new DurationOperationsImpl(this);
        this.plainDates = new PlainDatesImpl(this);
        this.plainTimes = new PlainTimesImpl(this);
        this.collectionsBytes = new CollectionsBytesImpl(this);
        this.collectionsModels = new CollectionsModelsImpl(this);
        this.stringLiterals = new StringLiteralsImpl(this);
        this.intLiterals = new IntLiteralsImpl(this);
        this.floatLiterals = new FloatLiteralsImpl(this);
        this.booleanLiterals = new BooleanLiteralsImpl(this);
        this.unionStringLiterals = new UnionStringLiteralsImpl(this);
        this.unionIntLiterals = new UnionIntLiteralsImpl(this);
        this.unionFloatLiterals = new UnionFloatLiteralsImpl(this);
        this.requiredAndOptionals = new RequiredAndOptionalsImpl(this);
    }

    /**
     * Gets the BooleanLiteralsImpl object to access its operations.
     *
     * @return the BooleanLiteralsImpl object.
     */
    public BooleanLiteralsImpl getBooleanLiterals() {
        return this.booleanLiterals;
    }

    /**
     * Gets the BytesImpl object to access its operations.
     *
     * @return the BytesImpl object.
     */
    public BytesImpl getBytes() {
        return this.bytes;
    }

    /**
     * Gets the CollectionsBytesImpl object to access its operations.
     *
     * @return the CollectionsBytesImpl object.
     */
    public CollectionsBytesImpl getCollectionsBytes() {
        return this.collectionsBytes;
    }

    /**
     * Gets the CollectionsModelsImpl object to access its operations.
     *
     * @return the CollectionsModelsImpl object.
     */
    public CollectionsModelsImpl getCollectionsModels() {
        return this.collectionsModels;
    }

    /**
     * Gets the DatetimeOperationsImpl object to access its operations.
     *
     * @return the DatetimeOperationsImpl object.
     */
    public DatetimeOperationsImpl getDatetimeOperations() {
        return this.datetimeOperations;
    }

    /**
     * Gets the DurationOperationsImpl object to access its operations.
     *
     * @return the DurationOperationsImpl object.
     */
    public DurationOperationsImpl getDurationOperations() {
        return this.durationOperations;
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
     * Gets the FloatLiteralsImpl object to access its operations.
     *
     * @return the FloatLiteralsImpl object.
     */
    public FloatLiteralsImpl getFloatLiterals() {
        return this.floatLiterals;
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
     * Gets the IntLiteralsImpl object to access its operations.
     *
     * @return the IntLiteralsImpl object.
     */
    public IntLiteralsImpl getIntLiterals() {
        return this.intLiterals;
    }

    /**
     * Gets the PlainDatesImpl object to access its operations.
     *
     * @return the PlainDatesImpl object.
     */
    public PlainDatesImpl getPlainDates() {
        return this.plainDates;
    }

    /**
     * Gets the PlainTimesImpl object to access its operations.
     *
     * @return the PlainTimesImpl object.
     */
    public PlainTimesImpl getPlainTimes() {
        return this.plainTimes;
    }

    /**
     * Gets the RequiredAndOptionalsImpl object to access its operations.
     *
     * @return the RequiredAndOptionalsImpl object.
     */
    public RequiredAndOptionalsImpl getRequiredAndOptionals() {
        return this.requiredAndOptionals;
    }

    /**
     * Gets the StringLiteralsImpl object to access its operations.
     *
     * @return the StringLiteralsImpl object.
     */
    public StringLiteralsImpl getStringLiterals() {
        return this.stringLiterals;
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
     * Gets the UnionFloatLiteralsImpl object to access its operations.
     *
     * @return the UnionFloatLiteralsImpl object.
     */
    public UnionFloatLiteralsImpl getUnionFloatLiterals() {
        return this.unionFloatLiterals;
    }

    /**
     * Gets the UnionIntLiteralsImpl object to access its operations.
     *
     * @return the UnionIntLiteralsImpl object.
     */
    public UnionIntLiteralsImpl getUnionIntLiterals() {
        return this.unionIntLiterals;
    }

    /**
     * Gets the UnionStringLiteralsImpl object to access its operations.
     *
     * @return the UnionStringLiteralsImpl object.
     */
    public UnionStringLiteralsImpl getUnionStringLiterals() {
        return this.unionStringLiterals;
    }
}
