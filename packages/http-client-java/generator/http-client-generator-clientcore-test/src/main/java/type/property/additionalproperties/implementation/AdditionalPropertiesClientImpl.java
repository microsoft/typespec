package type.property.additionalproperties.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the AdditionalPropertiesClient type.
 */
public final class AdditionalPropertiesClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The ExtendsDifferentSpreadFloatsImpl object to access its operations.
     */
    private final ExtendsDifferentSpreadFloatsImpl extendsDifferentSpreadFloats;

    /**
     * The ExtendsDifferentSpreadModelArraysImpl object to access its operations.
     */
    private final ExtendsDifferentSpreadModelArraysImpl extendsDifferentSpreadModelArrays;

    /**
     * The ExtendsDifferentSpreadModelsImpl object to access its operations.
     */
    private final ExtendsDifferentSpreadModelsImpl extendsDifferentSpreadModels;

    /**
     * The ExtendsDifferentSpreadStringsImpl object to access its operations.
     */
    private final ExtendsDifferentSpreadStringsImpl extendsDifferentSpreadStrings;

    /**
     * The ExtendsFloatsImpl object to access its operations.
     */
    private final ExtendsFloatsImpl extendsFloats;

    /**
     * The ExtendsModelArraysImpl object to access its operations.
     */
    private final ExtendsModelArraysImpl extendsModelArrays;

    /**
     * The ExtendsModelsImpl object to access its operations.
     */
    private final ExtendsModelsImpl extendsModels;

    /**
     * The ExtendsStringsImpl object to access its operations.
     */
    private final ExtendsStringsImpl extendsStrings;

    /**
     * The ExtendsUnknownDerivedsImpl object to access its operations.
     */
    private final ExtendsUnknownDerivedsImpl extendsUnknownDeriveds;

    /**
     * The ExtendsUnknownDiscriminatedsImpl object to access its operations.
     */
    private final ExtendsUnknownDiscriminatedsImpl extendsUnknownDiscriminateds;

    /**
     * The ExtendsUnknownsImpl object to access its operations.
     */
    private final ExtendsUnknownsImpl extendsUnknowns;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The IsFloatsImpl object to access its operations.
     */
    private final IsFloatsImpl isFloats;

    /**
     * The IsModelArraysImpl object to access its operations.
     */
    private final IsModelArraysImpl isModelArrays;

    /**
     * The IsModelsImpl object to access its operations.
     */
    private final IsModelsImpl isModels;

    /**
     * The IsStringsImpl object to access its operations.
     */
    private final IsStringsImpl isStrings;

    /**
     * The IsUnknownDerivedsImpl object to access its operations.
     */
    private final IsUnknownDerivedsImpl isUnknownDeriveds;

    /**
     * The IsUnknownDiscriminatedsImpl object to access its operations.
     */
    private final IsUnknownDiscriminatedsImpl isUnknownDiscriminateds;

    /**
     * The IsUnknownsImpl object to access its operations.
     */
    private final IsUnknownsImpl isUnknowns;

    /**
     * The MultipleSpreadsImpl object to access its operations.
     */
    private final MultipleSpreadsImpl multipleSpreads;

    /**
     * The SpreadDifferentFloatsImpl object to access its operations.
     */
    private final SpreadDifferentFloatsImpl spreadDifferentFloats;

    /**
     * The SpreadDifferentModelArraysImpl object to access its operations.
     */
    private final SpreadDifferentModelArraysImpl spreadDifferentModelArrays;

    /**
     * The SpreadDifferentModelsImpl object to access its operations.
     */
    private final SpreadDifferentModelsImpl spreadDifferentModels;

    /**
     * The SpreadDifferentStringsImpl object to access its operations.
     */
    private final SpreadDifferentStringsImpl spreadDifferentStrings;

    /**
     * The SpreadFloatsImpl object to access its operations.
     */
    private final SpreadFloatsImpl spreadFloats;

    /**
     * The SpreadModelArraysImpl object to access its operations.
     */
    private final SpreadModelArraysImpl spreadModelArrays;

    /**
     * The SpreadModelsImpl object to access its operations.
     */
    private final SpreadModelsImpl spreadModels;

    /**
     * The SpreadRecordNonDiscriminatedUnion2sImpl object to access its operations.
     */
    private final SpreadRecordNonDiscriminatedUnion2sImpl spreadRecordNonDiscriminatedUnion2s;

    /**
     * The SpreadRecordNonDiscriminatedUnion3sImpl object to access its operations.
     */
    private final SpreadRecordNonDiscriminatedUnion3sImpl spreadRecordNonDiscriminatedUnion3s;

    /**
     * The SpreadRecordNonDiscriminatedUnionsImpl object to access its operations.
     */
    private final SpreadRecordNonDiscriminatedUnionsImpl spreadRecordNonDiscriminatedUnions;

    /**
     * The SpreadRecordUnionsImpl object to access its operations.
     */
    private final SpreadRecordUnionsImpl spreadRecordUnions;

    /**
     * The SpreadStringsImpl object to access its operations.
     */
    private final SpreadStringsImpl spreadStrings;

    /**
     * Initializes an instance of AdditionalPropertiesClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public AdditionalPropertiesClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.extendsUnknowns = new ExtendsUnknownsImpl(this);
        this.extendsUnknownDeriveds = new ExtendsUnknownDerivedsImpl(this);
        this.extendsUnknownDiscriminateds = new ExtendsUnknownDiscriminatedsImpl(this);
        this.isUnknowns = new IsUnknownsImpl(this);
        this.isUnknownDeriveds = new IsUnknownDerivedsImpl(this);
        this.isUnknownDiscriminateds = new IsUnknownDiscriminatedsImpl(this);
        this.extendsStrings = new ExtendsStringsImpl(this);
        this.isStrings = new IsStringsImpl(this);
        this.spreadStrings = new SpreadStringsImpl(this);
        this.extendsFloats = new ExtendsFloatsImpl(this);
        this.isFloats = new IsFloatsImpl(this);
        this.spreadFloats = new SpreadFloatsImpl(this);
        this.extendsModels = new ExtendsModelsImpl(this);
        this.isModels = new IsModelsImpl(this);
        this.spreadModels = new SpreadModelsImpl(this);
        this.extendsModelArrays = new ExtendsModelArraysImpl(this);
        this.isModelArrays = new IsModelArraysImpl(this);
        this.spreadModelArrays = new SpreadModelArraysImpl(this);
        this.spreadDifferentStrings = new SpreadDifferentStringsImpl(this);
        this.spreadDifferentFloats = new SpreadDifferentFloatsImpl(this);
        this.spreadDifferentModels = new SpreadDifferentModelsImpl(this);
        this.spreadDifferentModelArrays = new SpreadDifferentModelArraysImpl(this);
        this.extendsDifferentSpreadStrings = new ExtendsDifferentSpreadStringsImpl(this);
        this.extendsDifferentSpreadFloats = new ExtendsDifferentSpreadFloatsImpl(this);
        this.extendsDifferentSpreadModels = new ExtendsDifferentSpreadModelsImpl(this);
        this.extendsDifferentSpreadModelArrays = new ExtendsDifferentSpreadModelArraysImpl(this);
        this.multipleSpreads = new MultipleSpreadsImpl(this);
        this.spreadRecordUnions = new SpreadRecordUnionsImpl(this);
        this.spreadRecordNonDiscriminatedUnions = new SpreadRecordNonDiscriminatedUnionsImpl(this);
        this.spreadRecordNonDiscriminatedUnion2s = new SpreadRecordNonDiscriminatedUnion2sImpl(this);
        this.spreadRecordNonDiscriminatedUnion3s = new SpreadRecordNonDiscriminatedUnion3sImpl(this);
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
     * Gets the ExtendsDifferentSpreadFloatsImpl object to access its operations.
     *
     * @return the ExtendsDifferentSpreadFloatsImpl object.
     */
    public ExtendsDifferentSpreadFloatsImpl getExtendsDifferentSpreadFloats() {
        return this.extendsDifferentSpreadFloats;
    }

    /**
     * Gets the ExtendsDifferentSpreadModelArraysImpl object to access its operations.
     *
     * @return the ExtendsDifferentSpreadModelArraysImpl object.
     */
    public ExtendsDifferentSpreadModelArraysImpl getExtendsDifferentSpreadModelArrays() {
        return this.extendsDifferentSpreadModelArrays;
    }

    /**
     * Gets the ExtendsDifferentSpreadModelsImpl object to access its operations.
     *
     * @return the ExtendsDifferentSpreadModelsImpl object.
     */
    public ExtendsDifferentSpreadModelsImpl getExtendsDifferentSpreadModels() {
        return this.extendsDifferentSpreadModels;
    }

    /**
     * Gets the ExtendsDifferentSpreadStringsImpl object to access its operations.
     *
     * @return the ExtendsDifferentSpreadStringsImpl object.
     */
    public ExtendsDifferentSpreadStringsImpl getExtendsDifferentSpreadStrings() {
        return this.extendsDifferentSpreadStrings;
    }

    /**
     * Gets the ExtendsFloatsImpl object to access its operations.
     *
     * @return the ExtendsFloatsImpl object.
     */
    public ExtendsFloatsImpl getExtendsFloats() {
        return this.extendsFloats;
    }

    /**
     * Gets the ExtendsModelArraysImpl object to access its operations.
     *
     * @return the ExtendsModelArraysImpl object.
     */
    public ExtendsModelArraysImpl getExtendsModelArrays() {
        return this.extendsModelArrays;
    }

    /**
     * Gets the ExtendsModelsImpl object to access its operations.
     *
     * @return the ExtendsModelsImpl object.
     */
    public ExtendsModelsImpl getExtendsModels() {
        return this.extendsModels;
    }

    /**
     * Gets the ExtendsStringsImpl object to access its operations.
     *
     * @return the ExtendsStringsImpl object.
     */
    public ExtendsStringsImpl getExtendsStrings() {
        return this.extendsStrings;
    }

    /**
     * Gets the ExtendsUnknownDerivedsImpl object to access its operations.
     *
     * @return the ExtendsUnknownDerivedsImpl object.
     */
    public ExtendsUnknownDerivedsImpl getExtendsUnknownDeriveds() {
        return this.extendsUnknownDeriveds;
    }

    /**
     * Gets the ExtendsUnknownDiscriminatedsImpl object to access its operations.
     *
     * @return the ExtendsUnknownDiscriminatedsImpl object.
     */
    public ExtendsUnknownDiscriminatedsImpl getExtendsUnknownDiscriminateds() {
        return this.extendsUnknownDiscriminateds;
    }

    /**
     * Gets the ExtendsUnknownsImpl object to access its operations.
     *
     * @return the ExtendsUnknownsImpl object.
     */
    public ExtendsUnknownsImpl getExtendsUnknowns() {
        return this.extendsUnknowns;
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
     * Gets the IsFloatsImpl object to access its operations.
     *
     * @return the IsFloatsImpl object.
     */
    public IsFloatsImpl getIsFloats() {
        return this.isFloats;
    }

    /**
     * Gets the IsModelArraysImpl object to access its operations.
     *
     * @return the IsModelArraysImpl object.
     */
    public IsModelArraysImpl getIsModelArrays() {
        return this.isModelArrays;
    }

    /**
     * Gets the IsModelsImpl object to access its operations.
     *
     * @return the IsModelsImpl object.
     */
    public IsModelsImpl getIsModels() {
        return this.isModels;
    }

    /**
     * Gets the IsStringsImpl object to access its operations.
     *
     * @return the IsStringsImpl object.
     */
    public IsStringsImpl getIsStrings() {
        return this.isStrings;
    }

    /**
     * Gets the IsUnknownDerivedsImpl object to access its operations.
     *
     * @return the IsUnknownDerivedsImpl object.
     */
    public IsUnknownDerivedsImpl getIsUnknownDeriveds() {
        return this.isUnknownDeriveds;
    }

    /**
     * Gets the IsUnknownDiscriminatedsImpl object to access its operations.
     *
     * @return the IsUnknownDiscriminatedsImpl object.
     */
    public IsUnknownDiscriminatedsImpl getIsUnknownDiscriminateds() {
        return this.isUnknownDiscriminateds;
    }

    /**
     * Gets the IsUnknownsImpl object to access its operations.
     *
     * @return the IsUnknownsImpl object.
     */
    public IsUnknownsImpl getIsUnknowns() {
        return this.isUnknowns;
    }

    /**
     * Gets the MultipleSpreadsImpl object to access its operations.
     *
     * @return the MultipleSpreadsImpl object.
     */
    public MultipleSpreadsImpl getMultipleSpreads() {
        return this.multipleSpreads;
    }

    /**
     * Gets the SpreadDifferentFloatsImpl object to access its operations.
     *
     * @return the SpreadDifferentFloatsImpl object.
     */
    public SpreadDifferentFloatsImpl getSpreadDifferentFloats() {
        return this.spreadDifferentFloats;
    }

    /**
     * Gets the SpreadDifferentModelArraysImpl object to access its operations.
     *
     * @return the SpreadDifferentModelArraysImpl object.
     */
    public SpreadDifferentModelArraysImpl getSpreadDifferentModelArrays() {
        return this.spreadDifferentModelArrays;
    }

    /**
     * Gets the SpreadDifferentModelsImpl object to access its operations.
     *
     * @return the SpreadDifferentModelsImpl object.
     */
    public SpreadDifferentModelsImpl getSpreadDifferentModels() {
        return this.spreadDifferentModels;
    }

    /**
     * Gets the SpreadDifferentStringsImpl object to access its operations.
     *
     * @return the SpreadDifferentStringsImpl object.
     */
    public SpreadDifferentStringsImpl getSpreadDifferentStrings() {
        return this.spreadDifferentStrings;
    }

    /**
     * Gets the SpreadFloatsImpl object to access its operations.
     *
     * @return the SpreadFloatsImpl object.
     */
    public SpreadFloatsImpl getSpreadFloats() {
        return this.spreadFloats;
    }

    /**
     * Gets the SpreadModelArraysImpl object to access its operations.
     *
     * @return the SpreadModelArraysImpl object.
     */
    public SpreadModelArraysImpl getSpreadModelArrays() {
        return this.spreadModelArrays;
    }

    /**
     * Gets the SpreadModelsImpl object to access its operations.
     *
     * @return the SpreadModelsImpl object.
     */
    public SpreadModelsImpl getSpreadModels() {
        return this.spreadModels;
    }

    /**
     * Gets the SpreadRecordNonDiscriminatedUnion2sImpl object to access its operations.
     *
     * @return the SpreadRecordNonDiscriminatedUnion2sImpl object.
     */
    public SpreadRecordNonDiscriminatedUnion2sImpl getSpreadRecordNonDiscriminatedUnion2s() {
        return this.spreadRecordNonDiscriminatedUnion2s;
    }

    /**
     * Gets the SpreadRecordNonDiscriminatedUnion3sImpl object to access its operations.
     *
     * @return the SpreadRecordNonDiscriminatedUnion3sImpl object.
     */
    public SpreadRecordNonDiscriminatedUnion3sImpl getSpreadRecordNonDiscriminatedUnion3s() {
        return this.spreadRecordNonDiscriminatedUnion3s;
    }

    /**
     * Gets the SpreadRecordNonDiscriminatedUnionsImpl object to access its operations.
     *
     * @return the SpreadRecordNonDiscriminatedUnionsImpl object.
     */
    public SpreadRecordNonDiscriminatedUnionsImpl getSpreadRecordNonDiscriminatedUnions() {
        return this.spreadRecordNonDiscriminatedUnions;
    }

    /**
     * Gets the SpreadRecordUnionsImpl object to access its operations.
     *
     * @return the SpreadRecordUnionsImpl object.
     */
    public SpreadRecordUnionsImpl getSpreadRecordUnions() {
        return this.spreadRecordUnions;
    }

    /**
     * Gets the SpreadStringsImpl object to access its operations.
     *
     * @return the SpreadStringsImpl object.
     */
    public SpreadStringsImpl getSpreadStrings() {
        return this.spreadStrings;
    }
}
