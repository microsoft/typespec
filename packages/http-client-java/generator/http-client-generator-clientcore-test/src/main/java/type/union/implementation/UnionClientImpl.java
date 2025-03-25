package type.union.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the UnionClient type.
 */
public final class UnionClientImpl {
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
     * The StringsOnliesImpl object to access its operations.
     */
    private final StringsOnliesImpl stringsOnlies;

    /**
     * Gets the StringsOnliesImpl object to access its operations.
     * 
     * @return the StringsOnliesImpl object.
     */
    public StringsOnliesImpl getStringsOnlies() {
        return this.stringsOnlies;
    }

    /**
     * The StringExtensiblesImpl object to access its operations.
     */
    private final StringExtensiblesImpl stringExtensibles;

    /**
     * Gets the StringExtensiblesImpl object to access its operations.
     * 
     * @return the StringExtensiblesImpl object.
     */
    public StringExtensiblesImpl getStringExtensibles() {
        return this.stringExtensibles;
    }

    /**
     * The StringExtensibleNamedsImpl object to access its operations.
     */
    private final StringExtensibleNamedsImpl stringExtensibleNameds;

    /**
     * Gets the StringExtensibleNamedsImpl object to access its operations.
     * 
     * @return the StringExtensibleNamedsImpl object.
     */
    public StringExtensibleNamedsImpl getStringExtensibleNameds() {
        return this.stringExtensibleNameds;
    }

    /**
     * The IntsOnliesImpl object to access its operations.
     */
    private final IntsOnliesImpl intsOnlies;

    /**
     * Gets the IntsOnliesImpl object to access its operations.
     * 
     * @return the IntsOnliesImpl object.
     */
    public IntsOnliesImpl getIntsOnlies() {
        return this.intsOnlies;
    }

    /**
     * The FloatsOnliesImpl object to access its operations.
     */
    private final FloatsOnliesImpl floatsOnlies;

    /**
     * Gets the FloatsOnliesImpl object to access its operations.
     * 
     * @return the FloatsOnliesImpl object.
     */
    public FloatsOnliesImpl getFloatsOnlies() {
        return this.floatsOnlies;
    }

    /**
     * The ModelsOnliesImpl object to access its operations.
     */
    private final ModelsOnliesImpl modelsOnlies;

    /**
     * Gets the ModelsOnliesImpl object to access its operations.
     * 
     * @return the ModelsOnliesImpl object.
     */
    public ModelsOnliesImpl getModelsOnlies() {
        return this.modelsOnlies;
    }

    /**
     * The EnumsOnliesImpl object to access its operations.
     */
    private final EnumsOnliesImpl enumsOnlies;

    /**
     * Gets the EnumsOnliesImpl object to access its operations.
     * 
     * @return the EnumsOnliesImpl object.
     */
    public EnumsOnliesImpl getEnumsOnlies() {
        return this.enumsOnlies;
    }

    /**
     * The StringAndArraysImpl object to access its operations.
     */
    private final StringAndArraysImpl stringAndArrays;

    /**
     * Gets the StringAndArraysImpl object to access its operations.
     * 
     * @return the StringAndArraysImpl object.
     */
    public StringAndArraysImpl getStringAndArrays() {
        return this.stringAndArrays;
    }

    /**
     * The MixedLiteralsImpl object to access its operations.
     */
    private final MixedLiteralsImpl mixedLiterals;

    /**
     * Gets the MixedLiteralsImpl object to access its operations.
     * 
     * @return the MixedLiteralsImpl object.
     */
    public MixedLiteralsImpl getMixedLiterals() {
        return this.mixedLiterals;
    }

    /**
     * The MixedTypesImpl object to access its operations.
     */
    private final MixedTypesImpl mixedTypes;

    /**
     * Gets the MixedTypesImpl object to access its operations.
     * 
     * @return the MixedTypesImpl object.
     */
    public MixedTypesImpl getMixedTypes() {
        return this.mixedTypes;
    }

    /**
     * Initializes an instance of UnionClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public UnionClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
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
}
