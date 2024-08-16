// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.XmlSerializationFormat;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class ModelPropertyMapper implements IMapper<Property, ClientModelProperty>, NeedsPlainObjectCheck {
    private static final ModelPropertyMapper INSTANCE = new ModelPropertyMapper();

    public static ModelPropertyMapper getInstance() {
        return INSTANCE;
    }

    protected ModelPropertyMapper() {
    }

    @Override
    public ClientModelProperty map(Property property) {
        return map(property, false);
    }

    /**
     * ClientModelProperty
     *
     * @param property the property
     * @param mutableAsOptional make mutable property optional, for JSON Merge Patch
     * @return ClientModelProperty
     */
    public ClientModelProperty map(Property property, boolean mutableAsOptional) {
        JavaSettings settings = JavaSettings.getInstance();

        ClientModelProperty.Builder builder = new ClientModelProperty.Builder()
                .name(property.getLanguage().getJava().getName())
                .required(property.isRequired())
                .readOnly(property.isReadOnly());

        if (mutableAsOptional && !property.isReadOnly() && !property.isIsDiscriminator()) {
            builder.required(false);
            builder.requiredForCreate(property.isRequired());
        }

        String description;
        String summaryInProperty = property.getSummary();
        String descriptionInProperty = property.getLanguage().getJava() == null ? null : property.getLanguage().getJava().getDescription();
        if (CoreUtils.isNullOrEmpty(summaryInProperty) && CoreUtils.isNullOrEmpty(descriptionInProperty)) {
            description = String.format("The %s property.", property.getSerializedName());
        } else {
            description = SchemaUtil.mergeSummaryWithDescription(summaryInProperty, descriptionInProperty);
        }
        builder.description(description);

        boolean flattened = false;
        if (settings.getModelerSettings().isFlattenModel()) {   // enabled by modelerfour
            if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.TYPE) {
                if (property.getParentSchema() != null) {
                    flattened = property.getParentSchema().getProperties().stream()
                            .anyMatch(p -> !CoreUtils.isNullOrEmpty(p.getFlattenedNames()));
                    if (!flattened) {
                        String discriminatorSerializedName = SchemaUtil.getDiscriminatorSerializedName(property.getParentSchema());
                        flattened = discriminatorSerializedName.contains(".");
                    }
                } else {
                    flattened = !CoreUtils.isNullOrEmpty(property.getFlattenedNames());
                }
            } else if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.FIELD) {
                flattened = !CoreUtils.isNullOrEmpty(property.getFlattenedNames());
            }
        }
        builder.needsFlatten(flattened);

        if (property.getExtensions() != null && property.getExtensions().isXmsClientFlatten()
                // avoid non-object schema or a plain object schema without any properties
                && property.getSchema() instanceof ObjectSchema && !isPlainObject((ObjectSchema) property.getSchema())
                && settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.NONE) {
            // avoid naming conflict
            builder.name("inner" + CodeNamer.toPascalCase(property.getLanguage().getJava().getName()));
            builder.clientFlatten(true);
        }

        StringBuilder serializedName = new StringBuilder();
        if (property.getFlattenedNames() != null && !property.getFlattenedNames().isEmpty()) {
            for (String flattenedName : property.getFlattenedNames()) {
                serializedName.append(flattenedName.replace(".", "\\\\.")).append(".");
            }
            serializedName.deleteCharAt(serializedName.length() - 1);
        } else if (flattened) {
            serializedName.append(property.getSerializedName().replace(".", "\\\\."));
        } else {
            serializedName.append(property.getSerializedName());
        }
        builder.serializedName(serializedName.toString());
        if (serializedName.toString().isEmpty() && "additionalProperties".equals(property.getLanguage().getJava().getName())) {
            builder.additionalProperties(true);
        }

        boolean propertyIsSecret = false;
        if (property.getExtensions() != null) {
            if (property.getExtensions().getXmsSecret() != null) {
                propertyIsSecret = property.getExtensions().getXmsSecret();
            }
        }

        XmlSerializationFormat xmlSerializationFormat = null;
        if (property.getSchema().getSerialization() != null) {
            xmlSerializationFormat = property.getSchema().getSerialization().getXml();
        }

        String xmlName = null;
        String xmlNamespace = null;
        boolean isXmlWrapper = false;
        boolean isXmlAttribute = false;
        boolean isXmlText = false;
        String xmlPrefix = null;
        if (xmlSerializationFormat != null) {
            isXmlWrapper = xmlSerializationFormat.isWrapped();
            isXmlAttribute = xmlSerializationFormat.isAttribute();
            xmlName = xmlSerializationFormat.getName();
            xmlNamespace = xmlSerializationFormat.getNamespace();
            isXmlText = xmlSerializationFormat.isText();
            xmlPrefix = xmlSerializationFormat.getPrefix();
        }

        final String xmlParamName = xmlName == null ? serializedName.toString() : xmlName;
        builder.xmlName(xmlParamName)
            .xmlWrapper(isXmlWrapper)
            .xmlAttribute(isXmlAttribute)
            .xmlNamespace(xmlNamespace)
            .xmlText(isXmlText)
            .xmlPrefix(xmlPrefix);

        List<String> annotationArgumentList = new ArrayList<String>() {{
            add(String.format("value = \"%s\"", xmlParamName));
        }};

        if (property.isRequired() && !propertyIsSecret && !settings.isDisableRequiredJsonAnnotation()) {
            annotationArgumentList.add("required = true");
        }

        // Though this looks odd to add WRITE_ONLY access when the property is marked as read-only it is the correct
        // behavior. The Swagger definition for read-only is from the perspective of the service which correlates to
        // write-only behavior in an SDK.
        if (property.isReadOnly()) {
            annotationArgumentList.add("access = JsonProperty.Access.WRITE_ONLY");
        }
        builder.annotationArguments(String.join(", ", annotationArgumentList));

        String headerCollectionPrefix = null;
        if (property.getExtensions() != null && property.getExtensions().getXmsHeaderCollectionPrefix() != null) {
            headerCollectionPrefix = property.getExtensions().getXmsHeaderCollectionPrefix();
        }
        builder.headerCollectionPrefix(headerCollectionPrefix);

        IType propertyWireType = Mappers.getSchemaMapper().map(property.getSchema());
        if (property.isNullable() || !property.isRequired()) {
            propertyWireType = propertyWireType.asNullable();
        }
        // Invariant: clientType == wireType.getClientType()
        IType propertyClientType = propertyWireType.getClientType();
        builder.wireType(propertyWireType).clientType(propertyClientType);

        Schema autoRestPropertyModelType = property.getSchema();
        if (autoRestPropertyModelType instanceof ArraySchema) {
            ArraySchema sequence = (ArraySchema) autoRestPropertyModelType;
            if (sequence.getElementType().getSerialization() != null
                && sequence.getElementType().getSerialization().getXml() != null
                && sequence.getElementType().getSerialization().getXml().getName() != null) {
                builder.xmlListElementName(sequence.getElementType().getSerialization().getXml().getName());
                builder.xmlListElementNamespace(sequence.getElementType().getSerialization().getXml().getNamespace());
                builder.xmlListElementPrefix(sequence.getElementType().getSerialization().getXml().getPrefix());
            } else {
                builder.xmlListElementName(sequence.getElementType().getLanguage().getDefault().getName());
                builder.xmlListElementNamespace(sequence.getElementType().getLanguage().getDefault().getNamespace());
            }
        }

        if (property.getSchema() instanceof ConstantSchema) {
            Object objValue = ((ConstantSchema) property.getSchema()).getValue().getValue();
            builder.constant(true);
            builder.defaultValue(objValue == null ? null : propertyClientType.defaultValueExpression(String.valueOf(objValue)));
        }

        // x-ms-mutability
        if (property.getExtensions() != null) {
            List<String> xmsMutability = property.getExtensions().getXmsMutability();
            if (xmsMutability != null) {
                List<ClientModelProperty.Mutability> mutabilities = xmsMutability.stream()
                        .map(m -> ClientModelProperty.Mutability.valueOf(m.toUpperCase(Locale.ROOT)))
                        .collect(Collectors.toList());
                builder.mutabilities(mutabilities);
            }
        }

        // handle x-ms-client-default for primitive type, enum, boxed type and string
        if (property.getClientDefaultValue() != null &&
                (propertyWireType instanceof PrimitiveType || propertyWireType instanceof EnumType ||
                        (propertyWireType instanceof ClassType && ((ClassType) propertyWireType).isBoxedType()) ||
                        propertyWireType.equals(ClassType.STRING))) {
            String autoRestPropertyDefaultValueExpression = propertyWireType.defaultValueExpression(property.getClientDefaultValue());
            builder.defaultValue(autoRestPropertyDefaultValueExpression);
        }

        return builder.build();
    }
}
