package type.array.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the ArrayClient type.
 */
public final class ArrayClientImpl {

    /**
     * The BooleanValuesImpl object to access its operations.
     */
    private final BooleanValuesImpl booleanValues;

    /**
     * The DatetimeValuesImpl object to access its operations.
     */
    private final DatetimeValuesImpl datetimeValues;

    /**
     * The DurationValuesImpl object to access its operations.
     */
    private final DurationValuesImpl durationValues;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The Float32ValuesImpl object to access its operations.
     */
    private final Float32ValuesImpl float32Values;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The Int32ValuesImpl object to access its operations.
     */
    private final Int32ValuesImpl int32Values;

    /**
     * The Int64ValuesImpl object to access its operations.
     */
    private final Int64ValuesImpl int64Values;

    /**
     * The ModelValuesImpl object to access its operations.
     */
    private final ModelValuesImpl modelValues;

    /**
     * The NullableBooleanValuesImpl object to access its operations.
     */
    private final NullableBooleanValuesImpl nullableBooleanValues;

    /**
     * The NullableFloatValuesImpl object to access its operations.
     */
    private final NullableFloatValuesImpl nullableFloatValues;

    /**
     * The NullableInt32ValuesImpl object to access its operations.
     */
    private final NullableInt32ValuesImpl nullableInt32Values;

    /**
     * The NullableModelValuesImpl object to access its operations.
     */
    private final NullableModelValuesImpl nullableModelValues;

    /**
     * The NullableStringValuesImpl object to access its operations.
     */
    private final NullableStringValuesImpl nullableStringValues;

    /**
     * The StringValuesImpl object to access its operations.
     */
    private final StringValuesImpl stringValues;

    /**
     * The UnknownValuesImpl object to access its operations.
     */
    private final UnknownValuesImpl unknownValues;

    /**
     * Initializes an instance of ArrayClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ArrayClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.int32Values = new Int32ValuesImpl(this);
        this.int64Values = new Int64ValuesImpl(this);
        this.booleanValues = new BooleanValuesImpl(this);
        this.stringValues = new StringValuesImpl(this);
        this.float32Values = new Float32ValuesImpl(this);
        this.datetimeValues = new DatetimeValuesImpl(this);
        this.durationValues = new DurationValuesImpl(this);
        this.unknownValues = new UnknownValuesImpl(this);
        this.modelValues = new ModelValuesImpl(this);
        this.nullableFloatValues = new NullableFloatValuesImpl(this);
        this.nullableInt32Values = new NullableInt32ValuesImpl(this);
        this.nullableBooleanValues = new NullableBooleanValuesImpl(this);
        this.nullableStringValues = new NullableStringValuesImpl(this);
        this.nullableModelValues = new NullableModelValuesImpl(this);
    }

    /**
     * Gets the BooleanValuesImpl object to access its operations.
     *
     * @return the BooleanValuesImpl object.
     */
    public BooleanValuesImpl getBooleanValues() {
        return this.booleanValues;
    }

    /**
     * Gets the DatetimeValuesImpl object to access its operations.
     *
     * @return the DatetimeValuesImpl object.
     */
    public DatetimeValuesImpl getDatetimeValues() {
        return this.datetimeValues;
    }

    /**
     * Gets the DurationValuesImpl object to access its operations.
     *
     * @return the DurationValuesImpl object.
     */
    public DurationValuesImpl getDurationValues() {
        return this.durationValues;
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
     * Gets the Float32ValuesImpl object to access its operations.
     *
     * @return the Float32ValuesImpl object.
     */
    public Float32ValuesImpl getFloat32Values() {
        return this.float32Values;
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
     * Gets the Int32ValuesImpl object to access its operations.
     *
     * @return the Int32ValuesImpl object.
     */
    public Int32ValuesImpl getInt32Values() {
        return this.int32Values;
    }

    /**
     * Gets the Int64ValuesImpl object to access its operations.
     *
     * @return the Int64ValuesImpl object.
     */
    public Int64ValuesImpl getInt64Values() {
        return this.int64Values;
    }

    /**
     * Gets the ModelValuesImpl object to access its operations.
     *
     * @return the ModelValuesImpl object.
     */
    public ModelValuesImpl getModelValues() {
        return this.modelValues;
    }

    /**
     * Gets the NullableBooleanValuesImpl object to access its operations.
     *
     * @return the NullableBooleanValuesImpl object.
     */
    public NullableBooleanValuesImpl getNullableBooleanValues() {
        return this.nullableBooleanValues;
    }

    /**
     * Gets the NullableFloatValuesImpl object to access its operations.
     *
     * @return the NullableFloatValuesImpl object.
     */
    public NullableFloatValuesImpl getNullableFloatValues() {
        return this.nullableFloatValues;
    }

    /**
     * Gets the NullableInt32ValuesImpl object to access its operations.
     *
     * @return the NullableInt32ValuesImpl object.
     */
    public NullableInt32ValuesImpl getNullableInt32Values() {
        return this.nullableInt32Values;
    }

    /**
     * Gets the NullableModelValuesImpl object to access its operations.
     *
     * @return the NullableModelValuesImpl object.
     */
    public NullableModelValuesImpl getNullableModelValues() {
        return this.nullableModelValues;
    }

    /**
     * Gets the NullableStringValuesImpl object to access its operations.
     *
     * @return the NullableStringValuesImpl object.
     */
    public NullableStringValuesImpl getNullableStringValues() {
        return this.nullableStringValues;
    }

    /**
     * Gets the StringValuesImpl object to access its operations.
     *
     * @return the StringValuesImpl object.
     */
    public StringValuesImpl getStringValues() {
        return this.stringValues;
    }

    /**
     * Gets the UnknownValuesImpl object to access its operations.
     *
     * @return the UnknownValuesImpl object.
     */
    public UnknownValuesImpl getUnknownValues() {
        return this.unknownValues;
    }
}
