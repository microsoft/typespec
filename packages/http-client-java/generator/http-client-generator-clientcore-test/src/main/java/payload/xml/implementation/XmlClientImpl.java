package payload.xml.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the XmlClient type.
 */
public final class XmlClientImpl {
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
     * The SimpleModelValuesImpl object to access its operations.
     */
    private final SimpleModelValuesImpl simpleModelValues;

    /**
     * Gets the SimpleModelValuesImpl object to access its operations.
     * 
     * @return the SimpleModelValuesImpl object.
     */
    public SimpleModelValuesImpl getSimpleModelValues() {
        return this.simpleModelValues;
    }

    /**
     * The ModelWithSimpleArraysValuesImpl object to access its operations.
     */
    private final ModelWithSimpleArraysValuesImpl modelWithSimpleArraysValues;

    /**
     * Gets the ModelWithSimpleArraysValuesImpl object to access its operations.
     * 
     * @return the ModelWithSimpleArraysValuesImpl object.
     */
    public ModelWithSimpleArraysValuesImpl getModelWithSimpleArraysValues() {
        return this.modelWithSimpleArraysValues;
    }

    /**
     * The ModelWithArrayOfModelValuesImpl object to access its operations.
     */
    private final ModelWithArrayOfModelValuesImpl modelWithArrayOfModelValues;

    /**
     * Gets the ModelWithArrayOfModelValuesImpl object to access its operations.
     * 
     * @return the ModelWithArrayOfModelValuesImpl object.
     */
    public ModelWithArrayOfModelValuesImpl getModelWithArrayOfModelValues() {
        return this.modelWithArrayOfModelValues;
    }

    /**
     * The ModelWithOptionalFieldValuesImpl object to access its operations.
     */
    private final ModelWithOptionalFieldValuesImpl modelWithOptionalFieldValues;

    /**
     * Gets the ModelWithOptionalFieldValuesImpl object to access its operations.
     * 
     * @return the ModelWithOptionalFieldValuesImpl object.
     */
    public ModelWithOptionalFieldValuesImpl getModelWithOptionalFieldValues() {
        return this.modelWithOptionalFieldValues;
    }

    /**
     * The ModelWithAttributesValuesImpl object to access its operations.
     */
    private final ModelWithAttributesValuesImpl modelWithAttributesValues;

    /**
     * Gets the ModelWithAttributesValuesImpl object to access its operations.
     * 
     * @return the ModelWithAttributesValuesImpl object.
     */
    public ModelWithAttributesValuesImpl getModelWithAttributesValues() {
        return this.modelWithAttributesValues;
    }

    /**
     * The ModelWithUnwrappedArrayValuesImpl object to access its operations.
     */
    private final ModelWithUnwrappedArrayValuesImpl modelWithUnwrappedArrayValues;

    /**
     * Gets the ModelWithUnwrappedArrayValuesImpl object to access its operations.
     * 
     * @return the ModelWithUnwrappedArrayValuesImpl object.
     */
    public ModelWithUnwrappedArrayValuesImpl getModelWithUnwrappedArrayValues() {
        return this.modelWithUnwrappedArrayValues;
    }

    /**
     * The ModelWithRenamedArraysValuesImpl object to access its operations.
     */
    private final ModelWithRenamedArraysValuesImpl modelWithRenamedArraysValues;

    /**
     * Gets the ModelWithRenamedArraysValuesImpl object to access its operations.
     * 
     * @return the ModelWithRenamedArraysValuesImpl object.
     */
    public ModelWithRenamedArraysValuesImpl getModelWithRenamedArraysValues() {
        return this.modelWithRenamedArraysValues;
    }

    /**
     * The ModelWithRenamedFieldsValuesImpl object to access its operations.
     */
    private final ModelWithRenamedFieldsValuesImpl modelWithRenamedFieldsValues;

    /**
     * Gets the ModelWithRenamedFieldsValuesImpl object to access its operations.
     * 
     * @return the ModelWithRenamedFieldsValuesImpl object.
     */
    public ModelWithRenamedFieldsValuesImpl getModelWithRenamedFieldsValues() {
        return this.modelWithRenamedFieldsValues;
    }

    /**
     * The ModelWithEmptyArrayValuesImpl object to access its operations.
     */
    private final ModelWithEmptyArrayValuesImpl modelWithEmptyArrayValues;

    /**
     * Gets the ModelWithEmptyArrayValuesImpl object to access its operations.
     * 
     * @return the ModelWithEmptyArrayValuesImpl object.
     */
    public ModelWithEmptyArrayValuesImpl getModelWithEmptyArrayValues() {
        return this.modelWithEmptyArrayValues;
    }

    /**
     * The ModelWithTextValuesImpl object to access its operations.
     */
    private final ModelWithTextValuesImpl modelWithTextValues;

    /**
     * Gets the ModelWithTextValuesImpl object to access its operations.
     * 
     * @return the ModelWithTextValuesImpl object.
     */
    public ModelWithTextValuesImpl getModelWithTextValues() {
        return this.modelWithTextValues;
    }

    /**
     * The ModelWithDictionaryValuesImpl object to access its operations.
     */
    private final ModelWithDictionaryValuesImpl modelWithDictionaryValues;

    /**
     * Gets the ModelWithDictionaryValuesImpl object to access its operations.
     * 
     * @return the ModelWithDictionaryValuesImpl object.
     */
    public ModelWithDictionaryValuesImpl getModelWithDictionaryValues() {
        return this.modelWithDictionaryValues;
    }

    /**
     * The ModelWithEncodedNamesValuesImpl object to access its operations.
     */
    private final ModelWithEncodedNamesValuesImpl modelWithEncodedNamesValues;

    /**
     * Gets the ModelWithEncodedNamesValuesImpl object to access its operations.
     * 
     * @return the ModelWithEncodedNamesValuesImpl object.
     */
    public ModelWithEncodedNamesValuesImpl getModelWithEncodedNamesValues() {
        return this.modelWithEncodedNamesValues;
    }

    /**
     * Initializes an instance of XmlClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public XmlClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.simpleModelValues = new SimpleModelValuesImpl(this);
        this.modelWithSimpleArraysValues = new ModelWithSimpleArraysValuesImpl(this);
        this.modelWithArrayOfModelValues = new ModelWithArrayOfModelValuesImpl(this);
        this.modelWithOptionalFieldValues = new ModelWithOptionalFieldValuesImpl(this);
        this.modelWithAttributesValues = new ModelWithAttributesValuesImpl(this);
        this.modelWithUnwrappedArrayValues = new ModelWithUnwrappedArrayValuesImpl(this);
        this.modelWithRenamedArraysValues = new ModelWithRenamedArraysValuesImpl(this);
        this.modelWithRenamedFieldsValues = new ModelWithRenamedFieldsValuesImpl(this);
        this.modelWithEmptyArrayValues = new ModelWithEmptyArrayValuesImpl(this);
        this.modelWithTextValues = new ModelWithTextValuesImpl(this);
        this.modelWithDictionaryValues = new ModelWithDictionaryValuesImpl(this);
        this.modelWithEncodedNamesValues = new ModelWithEncodedNamesValuesImpl(this);
    }
}
