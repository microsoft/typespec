package payload.xml.implementation;

import io.clientcore.core.http.models.Response;
import io.clientcore.core.utils.CoreUtils;
import java.lang.reflect.ParameterizedType;
import payload.xml.ModelWithArrayOfModel;
import payload.xml.ModelWithAttributes;
import payload.xml.ModelWithDatetime;
import payload.xml.ModelWithDictionary;
import payload.xml.ModelWithEmptyArray;
import payload.xml.ModelWithEncodedNames;
import payload.xml.ModelWithEnum;
import payload.xml.ModelWithNamespace;
import payload.xml.ModelWithNamespaceOnProperties;
import payload.xml.ModelWithNestedModel;
import payload.xml.ModelWithOptionalField;
import payload.xml.ModelWithRenamedArrays;
import payload.xml.ModelWithRenamedAttribute;
import payload.xml.ModelWithRenamedFields;
import payload.xml.ModelWithRenamedNestedModel;
import payload.xml.ModelWithRenamedProperty;
import payload.xml.ModelWithRenamedUnwrappedModelArray;
import payload.xml.ModelWithRenamedWrappedAndItemModelArray;
import payload.xml.ModelWithRenamedWrappedModelArray;
import payload.xml.ModelWithSimpleArrays;
import payload.xml.ModelWithText;
import payload.xml.ModelWithUnwrappedArray;
import payload.xml.ModelWithUnwrappedModelArray;
import payload.xml.ModelWithWrappedPrimitiveCustomItemNames;
import payload.xml.SimpleModel;
import payload.xml.XmlErrorBody;

public final class PayloadXmlConstants {
    public static final ParameterizedType RESPONSE_OF_SIMPLE_MODEL_TYPE
        = CoreUtils.createParameterizedType(Response.class, SimpleModel.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_PROPERTY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedProperty.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_FIELDS_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedFields.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_NESTED_MODEL_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithNestedModel.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_NESTED_MODEL_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedNestedModel.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_SIMPLE_ARRAYS_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithSimpleArrays.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_UNWRAPPED_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithUnwrappedArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_ARRAYS_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedArrays.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_WRAPPED_PRIMITIVE_CUSTOM_ITEM_NAMES_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithWrappedPrimitiveCustomItemNames.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_ARRAY_OF_MODEL_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithArrayOfModel.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_UNWRAPPED_MODEL_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithUnwrappedModelArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_WRAPPED_MODEL_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedWrappedModelArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_UNWRAPPED_MODEL_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedUnwrappedModelArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_WRAPPED_AND_ITEM_MODEL_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedWrappedAndItemModelArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_ATTRIBUTES_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithAttributes.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_RENAMED_ATTRIBUTE_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithRenamedAttribute.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_NAMESPACE_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithNamespace.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_NAMESPACE_ON_PROPERTIES_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithNamespaceOnProperties.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_TEXT_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithText.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_OPTIONAL_FIELD_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithOptionalField.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_EMPTY_ARRAY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithEmptyArray.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_DICTIONARY_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithDictionary.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_ENCODED_NAMES_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithEncodedNames.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_ENUM_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithEnum.class);

    public static final ParameterizedType RESPONSE_OF_MODEL_WITH_DATETIME_TYPE
        = CoreUtils.createParameterizedType(Response.class, ModelWithDatetime.class);

    public static final ParameterizedType XML_ERROR_BODY_TYPE = CoreUtils.createParameterizedType(XmlErrorBody.class);

    private PayloadXmlConstants() {
    }
}
