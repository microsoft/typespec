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
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The ModelWithArrayOfModelValuesImpl object to access its operations.
     */
    private final ModelWithArrayOfModelValuesImpl modelWithArrayOfModelValues;

    /**
     * The ModelWithAttributesValuesImpl object to access its operations.
     */
    private final ModelWithAttributesValuesImpl modelWithAttributesValues;

    /**
     * The ModelWithDatetimeValuesImpl object to access its operations.
     */
    private final ModelWithDatetimeValuesImpl modelWithDatetimeValues;

    /**
     * The ModelWithDictionaryValuesImpl object to access its operations.
     */
    private final ModelWithDictionaryValuesImpl modelWithDictionaryValues;

    /**
     * The ModelWithEmptyArrayValuesImpl object to access its operations.
     */
    private final ModelWithEmptyArrayValuesImpl modelWithEmptyArrayValues;

    /**
     * The ModelWithEncodedNamesValuesImpl object to access its operations.
     */
    private final ModelWithEncodedNamesValuesImpl modelWithEncodedNamesValues;

    /**
     * The ModelWithEnumValuesImpl object to access its operations.
     */
    private final ModelWithEnumValuesImpl modelWithEnumValues;

    /**
     * The ModelWithNamespaceOnPropertiesValuesImpl object to access its operations.
     */
    private final ModelWithNamespaceOnPropertiesValuesImpl modelWithNamespaceOnPropertiesValues;

    /**
     * The ModelWithNamespaceValuesImpl object to access its operations.
     */
    private final ModelWithNamespaceValuesImpl modelWithNamespaceValues;

    /**
     * The ModelWithNestedModelValuesImpl object to access its operations.
     */
    private final ModelWithNestedModelValuesImpl modelWithNestedModelValues;

    /**
     * The ModelWithOptionalFieldValuesImpl object to access its operations.
     */
    private final ModelWithOptionalFieldValuesImpl modelWithOptionalFieldValues;

    /**
     * The ModelWithRenamedArraysValuesImpl object to access its operations.
     */
    private final ModelWithRenamedArraysValuesImpl modelWithRenamedArraysValues;

    /**
     * The ModelWithRenamedAttributeValuesImpl object to access its operations.
     */
    private final ModelWithRenamedAttributeValuesImpl modelWithRenamedAttributeValues;

    /**
     * The ModelWithRenamedFieldsValuesImpl object to access its operations.
     */
    private final ModelWithRenamedFieldsValuesImpl modelWithRenamedFieldsValues;

    /**
     * The ModelWithRenamedNestedModelValuesImpl object to access its operations.
     */
    private final ModelWithRenamedNestedModelValuesImpl modelWithRenamedNestedModelValues;

    /**
     * The ModelWithRenamedPropertyValuesImpl object to access its operations.
     */
    private final ModelWithRenamedPropertyValuesImpl modelWithRenamedPropertyValues;

    /**
     * The ModelWithRenamedUnwrappedModelArrayValuesImpl object to access its operations.
     */
    private final ModelWithRenamedUnwrappedModelArrayValuesImpl modelWithRenamedUnwrappedModelArrayValues;

    /**
     * The ModelWithRenamedWrappedAndItemModelArrayValuesImpl object to access its operations.
     */
    private final ModelWithRenamedWrappedAndItemModelArrayValuesImpl modelWithRenamedWrappedAndItemModelArrayValues;

    /**
     * The ModelWithRenamedWrappedModelArrayValuesImpl object to access its operations.
     */
    private final ModelWithRenamedWrappedModelArrayValuesImpl modelWithRenamedWrappedModelArrayValues;

    /**
     * The ModelWithSimpleArraysValuesImpl object to access its operations.
     */
    private final ModelWithSimpleArraysValuesImpl modelWithSimpleArraysValues;

    /**
     * The ModelWithTextValuesImpl object to access its operations.
     */
    private final ModelWithTextValuesImpl modelWithTextValues;

    /**
     * The ModelWithUnwrappedArrayValuesImpl object to access its operations.
     */
    private final ModelWithUnwrappedArrayValuesImpl modelWithUnwrappedArrayValues;

    /**
     * The ModelWithUnwrappedModelArrayValuesImpl object to access its operations.
     */
    private final ModelWithUnwrappedModelArrayValuesImpl modelWithUnwrappedModelArrayValues;

    /**
     * The ModelWithWrappedPrimitiveCustomItemNamesValuesImpl object to access its operations.
     */
    private final ModelWithWrappedPrimitiveCustomItemNamesValuesImpl modelWithWrappedPrimitiveCustomItemNamesValues;

    /**
     * The SimpleModelValuesImpl object to access its operations.
     */
    private final SimpleModelValuesImpl simpleModelValues;

    /**
     * The XmlErrorValuesImpl object to access its operations.
     */
    private final XmlErrorValuesImpl xmlErrorValues;

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
        this.modelWithRenamedPropertyValues = new ModelWithRenamedPropertyValuesImpl(this);
        this.modelWithRenamedFieldsValues = new ModelWithRenamedFieldsValuesImpl(this);
        this.modelWithNestedModelValues = new ModelWithNestedModelValuesImpl(this);
        this.modelWithRenamedNestedModelValues = new ModelWithRenamedNestedModelValuesImpl(this);
        this.modelWithSimpleArraysValues = new ModelWithSimpleArraysValuesImpl(this);
        this.modelWithUnwrappedArrayValues = new ModelWithUnwrappedArrayValuesImpl(this);
        this.modelWithRenamedArraysValues = new ModelWithRenamedArraysValuesImpl(this);
        this.modelWithWrappedPrimitiveCustomItemNamesValues
            = new ModelWithWrappedPrimitiveCustomItemNamesValuesImpl(this);
        this.modelWithArrayOfModelValues = new ModelWithArrayOfModelValuesImpl(this);
        this.modelWithUnwrappedModelArrayValues = new ModelWithUnwrappedModelArrayValuesImpl(this);
        this.modelWithRenamedWrappedModelArrayValues = new ModelWithRenamedWrappedModelArrayValuesImpl(this);
        this.modelWithRenamedUnwrappedModelArrayValues = new ModelWithRenamedUnwrappedModelArrayValuesImpl(this);
        this.modelWithRenamedWrappedAndItemModelArrayValues
            = new ModelWithRenamedWrappedAndItemModelArrayValuesImpl(this);
        this.modelWithAttributesValues = new ModelWithAttributesValuesImpl(this);
        this.modelWithRenamedAttributeValues = new ModelWithRenamedAttributeValuesImpl(this);
        this.modelWithNamespaceValues = new ModelWithNamespaceValuesImpl(this);
        this.modelWithNamespaceOnPropertiesValues = new ModelWithNamespaceOnPropertiesValuesImpl(this);
        this.modelWithTextValues = new ModelWithTextValuesImpl(this);
        this.modelWithOptionalFieldValues = new ModelWithOptionalFieldValuesImpl(this);
        this.modelWithEmptyArrayValues = new ModelWithEmptyArrayValuesImpl(this);
        this.modelWithDictionaryValues = new ModelWithDictionaryValuesImpl(this);
        this.modelWithEncodedNamesValues = new ModelWithEncodedNamesValuesImpl(this);
        this.modelWithEnumValues = new ModelWithEnumValuesImpl(this);
        this.modelWithDatetimeValues = new ModelWithDatetimeValuesImpl(this);
        this.xmlErrorValues = new XmlErrorValuesImpl(this);
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
     * Gets the ModelWithArrayOfModelValuesImpl object to access its operations.
     *
     * @return the ModelWithArrayOfModelValuesImpl object.
     */
    public ModelWithArrayOfModelValuesImpl getModelWithArrayOfModelValues() {
        return this.modelWithArrayOfModelValues;
    }

    /**
     * Gets the ModelWithAttributesValuesImpl object to access its operations.
     *
     * @return the ModelWithAttributesValuesImpl object.
     */
    public ModelWithAttributesValuesImpl getModelWithAttributesValues() {
        return this.modelWithAttributesValues;
    }

    /**
     * Gets the ModelWithDatetimeValuesImpl object to access its operations.
     *
     * @return the ModelWithDatetimeValuesImpl object.
     */
    public ModelWithDatetimeValuesImpl getModelWithDatetimeValues() {
        return this.modelWithDatetimeValues;
    }

    /**
     * Gets the ModelWithDictionaryValuesImpl object to access its operations.
     *
     * @return the ModelWithDictionaryValuesImpl object.
     */
    public ModelWithDictionaryValuesImpl getModelWithDictionaryValues() {
        return this.modelWithDictionaryValues;
    }

    /**
     * Gets the ModelWithEmptyArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithEmptyArrayValuesImpl object.
     */
    public ModelWithEmptyArrayValuesImpl getModelWithEmptyArrayValues() {
        return this.modelWithEmptyArrayValues;
    }

    /**
     * Gets the ModelWithEncodedNamesValuesImpl object to access its operations.
     *
     * @return the ModelWithEncodedNamesValuesImpl object.
     */
    public ModelWithEncodedNamesValuesImpl getModelWithEncodedNamesValues() {
        return this.modelWithEncodedNamesValues;
    }

    /**
     * Gets the ModelWithEnumValuesImpl object to access its operations.
     *
     * @return the ModelWithEnumValuesImpl object.
     */
    public ModelWithEnumValuesImpl getModelWithEnumValues() {
        return this.modelWithEnumValues;
    }

    /**
     * Gets the ModelWithNamespaceOnPropertiesValuesImpl object to access its operations.
     *
     * @return the ModelWithNamespaceOnPropertiesValuesImpl object.
     */
    public ModelWithNamespaceOnPropertiesValuesImpl getModelWithNamespaceOnPropertiesValues() {
        return this.modelWithNamespaceOnPropertiesValues;
    }

    /**
     * Gets the ModelWithNamespaceValuesImpl object to access its operations.
     *
     * @return the ModelWithNamespaceValuesImpl object.
     */
    public ModelWithNamespaceValuesImpl getModelWithNamespaceValues() {
        return this.modelWithNamespaceValues;
    }

    /**
     * Gets the ModelWithNestedModelValuesImpl object to access its operations.
     *
     * @return the ModelWithNestedModelValuesImpl object.
     */
    public ModelWithNestedModelValuesImpl getModelWithNestedModelValues() {
        return this.modelWithNestedModelValues;
    }

    /**
     * Gets the ModelWithOptionalFieldValuesImpl object to access its operations.
     *
     * @return the ModelWithOptionalFieldValuesImpl object.
     */
    public ModelWithOptionalFieldValuesImpl getModelWithOptionalFieldValues() {
        return this.modelWithOptionalFieldValues;
    }

    /**
     * Gets the ModelWithRenamedArraysValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedArraysValuesImpl object.
     */
    public ModelWithRenamedArraysValuesImpl getModelWithRenamedArraysValues() {
        return this.modelWithRenamedArraysValues;
    }

    /**
     * Gets the ModelWithRenamedAttributeValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedAttributeValuesImpl object.
     */
    public ModelWithRenamedAttributeValuesImpl getModelWithRenamedAttributeValues() {
        return this.modelWithRenamedAttributeValues;
    }

    /**
     * Gets the ModelWithRenamedFieldsValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedFieldsValuesImpl object.
     */
    public ModelWithRenamedFieldsValuesImpl getModelWithRenamedFieldsValues() {
        return this.modelWithRenamedFieldsValues;
    }

    /**
     * Gets the ModelWithRenamedNestedModelValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedNestedModelValuesImpl object.
     */
    public ModelWithRenamedNestedModelValuesImpl getModelWithRenamedNestedModelValues() {
        return this.modelWithRenamedNestedModelValues;
    }

    /**
     * Gets the ModelWithRenamedPropertyValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedPropertyValuesImpl object.
     */
    public ModelWithRenamedPropertyValuesImpl getModelWithRenamedPropertyValues() {
        return this.modelWithRenamedPropertyValues;
    }

    /**
     * Gets the ModelWithRenamedUnwrappedModelArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedUnwrappedModelArrayValuesImpl object.
     */
    public ModelWithRenamedUnwrappedModelArrayValuesImpl getModelWithRenamedUnwrappedModelArrayValues() {
        return this.modelWithRenamedUnwrappedModelArrayValues;
    }

    /**
     * Gets the ModelWithRenamedWrappedAndItemModelArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedWrappedAndItemModelArrayValuesImpl object.
     */
    public ModelWithRenamedWrappedAndItemModelArrayValuesImpl getModelWithRenamedWrappedAndItemModelArrayValues() {
        return this.modelWithRenamedWrappedAndItemModelArrayValues;
    }

    /**
     * Gets the ModelWithRenamedWrappedModelArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithRenamedWrappedModelArrayValuesImpl object.
     */
    public ModelWithRenamedWrappedModelArrayValuesImpl getModelWithRenamedWrappedModelArrayValues() {
        return this.modelWithRenamedWrappedModelArrayValues;
    }

    /**
     * Gets the ModelWithSimpleArraysValuesImpl object to access its operations.
     *
     * @return the ModelWithSimpleArraysValuesImpl object.
     */
    public ModelWithSimpleArraysValuesImpl getModelWithSimpleArraysValues() {
        return this.modelWithSimpleArraysValues;
    }

    /**
     * Gets the ModelWithTextValuesImpl object to access its operations.
     *
     * @return the ModelWithTextValuesImpl object.
     */
    public ModelWithTextValuesImpl getModelWithTextValues() {
        return this.modelWithTextValues;
    }

    /**
     * Gets the ModelWithUnwrappedArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithUnwrappedArrayValuesImpl object.
     */
    public ModelWithUnwrappedArrayValuesImpl getModelWithUnwrappedArrayValues() {
        return this.modelWithUnwrappedArrayValues;
    }

    /**
     * Gets the ModelWithUnwrappedModelArrayValuesImpl object to access its operations.
     *
     * @return the ModelWithUnwrappedModelArrayValuesImpl object.
     */
    public ModelWithUnwrappedModelArrayValuesImpl getModelWithUnwrappedModelArrayValues() {
        return this.modelWithUnwrappedModelArrayValues;
    }

    /**
     * Gets the ModelWithWrappedPrimitiveCustomItemNamesValuesImpl object to access its operations.
     *
     * @return the ModelWithWrappedPrimitiveCustomItemNamesValuesImpl object.
     */
    public ModelWithWrappedPrimitiveCustomItemNamesValuesImpl getModelWithWrappedPrimitiveCustomItemNamesValues() {
        return this.modelWithWrappedPrimitiveCustomItemNamesValues;
    }

    /**
     * Gets the SimpleModelValuesImpl object to access its operations.
     *
     * @return the SimpleModelValuesImpl object.
     */
    public SimpleModelValuesImpl getSimpleModelValues() {
        return this.simpleModelValues;
    }

    /**
     * Gets the XmlErrorValuesImpl object to access its operations.
     *
     * @return the XmlErrorValuesImpl object.
     */
    public XmlErrorValuesImpl getXmlErrorValues() {
        return this.xmlErrorValues;
    }
}
