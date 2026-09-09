package type.union.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the UnionClient type.
 */
public final class UnionClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The EnumsOnliesImpl object to access its operations.
     */
    private final EnumsOnliesImpl enumsOnlies;

    /**
     * The FloatsOnliesImpl object to access its operations.
     */
    private final FloatsOnliesImpl floatsOnlies;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The IntsOnliesImpl object to access its operations.
     */
    private final IntsOnliesImpl intsOnlies;

    /**
     * The MixedLiteralsImpl object to access its operations.
     */
    private final MixedLiteralsImpl mixedLiterals;

    /**
     * The MixedTypesImpl object to access its operations.
     */
    private final MixedTypesImpl mixedTypes;

    /**
     * The ModelsOnliesImpl object to access its operations.
     */
    private final ModelsOnliesImpl modelsOnlies;

    /**
     * The StringAndArraysImpl object to access its operations.
     */
    private final StringAndArraysImpl stringAndArrays;

    /**
     * The StringExtensibleNamedsImpl object to access its operations.
     */
    private final StringExtensibleNamedsImpl stringExtensibleNameds;

    /**
     * The StringExtensiblesImpl object to access its operations.
     */
    private final StringExtensiblesImpl stringExtensibles;

    /**
     * The StringsOnliesImpl object to access its operations.
     */
    private final StringsOnliesImpl stringsOnlies;

    /**
     * Initializes an instance of UnionClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public UnionClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.stringsOnlies = new StringsOnliesImpl(this);
        this.stringExtensibles = new StringExtensiblesImpl(this);
        this.stringExtensibleNameds = new StringExtensibleNamedsImpl(this);
        this.intsOnlies = new IntsOnliesImpl(this);
        this.floatsOnlies = new FloatsOnliesImpl(this);
        this.modelsOnlies = new ModelsOnliesImpl(this);
        this.enumsOnlies = new EnumsOnliesImpl(this);
        this.stringAndArrays = new StringAndArraysImpl(this);
        this.mixedLiterals = new MixedLiteralsImpl(this);
        this.mixedTypes = new MixedTypesImpl(this);
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
     * Gets the EnumsOnliesImpl object to access its operations.
     *
     * @return the EnumsOnliesImpl object.
     */
    public EnumsOnliesImpl getEnumsOnlies() {
        return this.enumsOnlies;
    }

    /**
     * Gets the FloatsOnliesImpl object to access its operations.
     *
     * @return the FloatsOnliesImpl object.
     */
    public FloatsOnliesImpl getFloatsOnlies() {
        return this.floatsOnlies;
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
     * Gets the IntsOnliesImpl object to access its operations.
     *
     * @return the IntsOnliesImpl object.
     */
    public IntsOnliesImpl getIntsOnlies() {
        return this.intsOnlies;
    }

    /**
     * Gets the MixedLiteralsImpl object to access its operations.
     *
     * @return the MixedLiteralsImpl object.
     */
    public MixedLiteralsImpl getMixedLiterals() {
        return this.mixedLiterals;
    }

    /**
     * Gets the MixedTypesImpl object to access its operations.
     *
     * @return the MixedTypesImpl object.
     */
    public MixedTypesImpl getMixedTypes() {
        return this.mixedTypes;
    }

    /**
     * Gets the ModelsOnliesImpl object to access its operations.
     *
     * @return the ModelsOnliesImpl object.
     */
    public ModelsOnliesImpl getModelsOnlies() {
        return this.modelsOnlies;
    }

    /**
     * Gets the StringAndArraysImpl object to access its operations.
     *
     * @return the StringAndArraysImpl object.
     */
    public StringAndArraysImpl getStringAndArrays() {
        return this.stringAndArrays;
    }

    /**
     * Gets the StringExtensibleNamedsImpl object to access its operations.
     *
     * @return the StringExtensibleNamedsImpl object.
     */
    public StringExtensibleNamedsImpl getStringExtensibleNameds() {
        return this.stringExtensibleNameds;
    }

    /**
     * Gets the StringExtensiblesImpl object to access its operations.
     *
     * @return the StringExtensiblesImpl object.
     */
    public StringExtensiblesImpl getStringExtensibles() {
        return this.stringExtensibles;
    }

    /**
     * Gets the StringsOnliesImpl object to access its operations.
     *
     * @return the StringsOnliesImpl object.
     */
    public StringsOnliesImpl getStringsOnlies() {
        return this.stringsOnlies;
    }
}
