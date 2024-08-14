// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

/**
 * A property that exists within a model defined by the client.
 */
public class ClientModelProperty implements ClientModelPropertyAccess {
    /**
     * Get the name of this property.
     */
    private final String name;
    /**
     * Get the description of this property.
     */
    private final String description;
    /**
     * Get the arguments that go into this property's JsonProperty annotation.
     */
    private final String annotationArguments;
    /**
     * Get whether this property is an attribute when serialized to XML.
     */
    private final boolean isXmlAttribute;
    /**
     * Get this property's name when serialized to XML.
     */
    private final String xmlName;
    private final String xmlNamespace;
    /**
     * Get this property's name when it is serialized.
     */
    private final String serializedName;
    /**
     * Get whether this property is a container.
     */
    private final boolean isXmlWrapper;
    /**
     * The name of each list element tag within an XML list property.
     */
    private final String xmlListElementName;
    /**
     * The namespace of each list element tag within an XML list property.
     */
    private final String xmlListElementNamespace;
    private final String xmlListElementPrefix;
    /**
     * The type of this property as it is transmitted across the network (across the wire).
     */
    private final IType wireType;
    /**
     * The type of this property as it will be exposed via the client.
     */
    private final IType clientType;
    /**
     * Get whether this property has a constant value.
     */
    private final boolean isConstant;
    /**
     * Get the default value expression of this property.
     */
    private final String defaultValue;
    /**
     * Get whether this property's value can be changed by the client library.
     */
    private final boolean isReadOnly;
    /**
     * Whether this property is required.
     */
    private boolean isRequired;
    /**
     * The prefix of the headers that make up this property's values.
     */
    private final String headerCollectionPrefix;

    private final boolean isAdditionalProperties;

    private final List<Mutability> mutabilities;

    private final boolean needsFlatten;
    private final boolean clientFlatten;
    private final boolean polymorphicDiscriminator;
    private final boolean isXmlText;
    private final String xmlPrefix;

    private final Boolean requiredForCreate;

    /**
     * Create a new ClientModelProperty with the provided properties.
     * @param name The name of this property.
     * @param description The description of this property.
     * @param annotationArguments The arguments that go into this property's JsonProperty annotation.
     * @param isXmlAttribute Whether this property is an attribute when serialized to XML.
     * @param xmlName This property's name when serialized to XML.
     * @param xmlNamespace Namespace of the XML attribute or element this property represents.
     * @param serializedName This property's name when it is serialized.
     * @param isXmlWrapper Whether this property is a container.
     * @param xmlListElementName The name of each list element tag within an XML list property.
     * @param wireType The type of this property as it is transmitted across the network (across the wire).
     * @param clientType The type of this property as it will be exposed via the client.
     * @param isConstant Whether this property has a constant value.
     * @param defaultValue The default value expression of this property.
     * @param isReadOnly Whether this property's value can be changed by the client library.
     * @param mutabilities List of property mutability.
     * @param headerCollectionPrefix The prefix of the headers that make up this property's values.
     * @param isAdditionalProperties Whether this property contain the additional properties.
     * @param polymorphicDiscriminator Whether this property is a polymorphic discriminator.
     * @param isXmlText Whether this property uses the value of an XML tag.
     * @param xmlPrefix The prefix of the XML attribute or element this property represents.
     */
    private ClientModelProperty(String name, String description, String annotationArguments, boolean isXmlAttribute,
        String xmlName, String xmlNamespace, String serializedName, boolean isXmlWrapper, String xmlListElementName,
        String xmlListElementNamespace, String xmlListElementPrefix, IType wireType, IType clientType,
        boolean isConstant, String defaultValue, boolean isReadOnly, List<Mutability> mutabilities, boolean isRequired,
        String headerCollectionPrefix, boolean isAdditionalProperties, boolean needsFlatten, boolean clientFlatten,
        boolean polymorphicDiscriminator, boolean isXmlText, String xmlPrefix, Boolean requiredForCreate) {
        this.name = name;
        this.description = description;
        this.annotationArguments = annotationArguments;
        this.isXmlAttribute = isXmlAttribute;
        this.xmlName = xmlName;
        this.xmlNamespace = xmlNamespace;
        this.serializedName = serializedName;
        this.isXmlWrapper = isXmlWrapper;
        this.xmlListElementName = xmlListElementName;
        this.xmlListElementNamespace = xmlListElementNamespace;
        this.xmlListElementPrefix = xmlListElementPrefix;
        this.wireType = wireType;
        this.clientType = clientType;
        this.isConstant = isConstant;
        this.defaultValue = defaultValue;
        this.isReadOnly = isReadOnly;
        this.mutabilities = mutabilities;
        this.isRequired = isRequired;
        this.headerCollectionPrefix = headerCollectionPrefix;
        this.isAdditionalProperties = isAdditionalProperties;
        this.needsFlatten = needsFlatten;
        this.clientFlatten = clientFlatten;
        this.polymorphicDiscriminator = polymorphicDiscriminator;
        this.isXmlText = isXmlText;
        this.xmlPrefix = xmlPrefix;
        this.requiredForCreate = requiredForCreate;
    }

    public final String getName() {
        return name;
    }

    public final String getGetterName() {
        return CodeNamer.getModelNamer().modelPropertyGetterName(this);
    }

    public final String getSetterName() {
        return CodeNamer.getModelNamer().modelPropertySetterName(this);
    }

    public final String getDescription() {
        return description;
    }

    public final String getAnnotationArguments() {
        return annotationArguments;
    }

    public final boolean isXmlAttribute() {
        return isXmlAttribute;
    }

    public final String getXmlName() {
        return xmlName;
    }

    public String getXmlNamespace() {
        return xmlNamespace;
    }

    public final String getSerializedName() {
        return serializedName;
    }

    public final boolean isXmlWrapper() {
        return isXmlWrapper;
    }

    public final String getXmlListElementName() {
        return xmlListElementName;
    }

    public final String getXmlListElementNamespace() {
        return xmlListElementNamespace;
    }

    public final String getXmlListElementPrefix() {
        return xmlListElementPrefix;
    }

    public final IType getWireType() {
        return wireType;
    }

    public final IType getClientType() {
        return clientType;
    }

    public final boolean isConstant() {
        return isConstant;
    }

    public final String getDefaultValue() {
        return defaultValue;
    }

    public final boolean isReadOnly() {
        return isReadOnly;
    }

    public final boolean isReadOnlyForCreate() {
        return isReadOnly || (this.getMutabilities() != null && !this.getMutabilities().contains(Mutability.CREATE));
    }

    public final boolean isReadOnlyForUpdate() {
        return isReadOnly || (this.getMutabilities() != null && !this.getMutabilities().contains(Mutability.UPDATE));
    }

    public final String getHeaderCollectionPrefix() {
        return headerCollectionPrefix;
    }

    /**
     * @return List of property mutability.
     */
    public List<Mutability> getMutabilities() {
        return mutabilities;
    }

    /**
     * @return whether the property need to be flatten.
     */
    public final boolean getNeedsFlatten() {
        return needsFlatten;
    }

    /**
     * @return whether the property is required to be flattened.
     */
    public final boolean getClientFlatten() {
        return clientFlatten;
    }

    /**
     * @return whether the property is a polymorphic discriminator.
     */
    public final boolean isPolymorphicDiscriminator() {
        return polymorphicDiscriminator;
    }

    /**
     * @return whether this property uses the value of an XML tag.
     */
    public final boolean isXmlText() {
        return isXmlText;
    }

    /**
     * Gets the XML prefix for the attribute or element.
     *
     * @return The XML prefix for this property.
     */
    public final String getXmlPrefix() {
        return xmlPrefix;
    }

    public boolean isRequiredForCreate() {
        return requiredForCreate == null ? this.isRequired() : requiredForCreate;
    }

    /**
     * Add this ServiceModelProperty's imports to the provided set of imports.
     * @param imports The set of imports to add to.
     */
    public final void addImportsTo(Set<String> imports, boolean shouldGenerateXmlSerialization) {
        JavaSettings settings = JavaSettings.getInstance();

        if (getHeaderCollectionPrefix() != null && !getHeaderCollectionPrefix().isEmpty()) {
            Annotation.HEADER_COLLECTION.addImportsTo(imports);
        }
        if (isAdditionalProperties) {
            imports.add("com.fasterxml.jackson.annotation.JsonIgnore");
            imports.add("com.fasterxml.jackson.annotation.JsonAnySetter");
            imports.add("com.fasterxml.jackson.annotation.JsonAnyGetter");
            imports.add(LinkedHashMap.class.getName());
        }

        if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.FIELD && needsFlatten) {
            addJsonFlattenAnnotationImport(imports);
        }

        if (!isAdditionalProperties && getClientType() instanceof MapType) {
            // required for "@JsonInclude(value = JsonInclude.Include.NON_NULL, content = JsonInclude.Include.ALWAYS)"
            imports.add("com.fasterxml.jackson.annotation.JsonInclude");
        }

        if (getWireType() != null) {
            getWireType().addImportsTo(imports, false);
        }
        getClientType().addImportsTo(imports, false);

        if (getClientType().equals(ArrayType.BYTE_ARRAY)) {
            imports.add(ClassType.CORE_UTILS.getFullName());
        }

        if (shouldGenerateXmlSerialization) {
            imports.add("com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement");
            if (isXmlWrapper()) {
                imports.add("com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty");
            }
            if (isXmlText()) {
                imports.add("com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlText");
            }
        } else {
            imports.add("com.fasterxml.jackson.annotation.JsonProperty");
        }
    }

    public boolean isRequired() {
        return isRequired;
    }

    public void setRequired(boolean required) {
        isRequired = required;
    }

    public boolean isAdditionalProperties() {
        return isAdditionalProperties;
    }

    protected void addJsonFlattenAnnotationImport(Set<String> imports) {
        imports.add("com.azure.core.annotation.JsonFlatten");
    }

    /**
     * Creates a builder that is initialized with all the builder properties set to current values of this instance.
     * @return A new builder instance initialized with properties values of this instance.
     */
    public Builder newBuilder() {
        return new Builder(this);
    }

    public enum Mutability {
        CREATE, UPDATE, READ
    }

    public static class Builder {
        private String name;
        private String description;
        private String annotationArguments;
        private boolean isXmlAttribute;
        private String xmlName;
        private String serializedName;
        private boolean isXmlWrapper;
        private String xmlListElementName;
        private String xmlListElementNamespace;
        private String xmlListElementPrefix;
        private IType wireType;
        private IType clientType;
        private boolean isConstant = false;
        private String defaultValue;
        private boolean isReadOnly;
        private boolean isRequired;
        private String headerCollectionPrefix;
        private boolean isAdditionalProperties = false;
        private String xmlNamespace;
        private List<Mutability> mutabilities;
        private boolean needsFlatten = false;
        private boolean clientFlatten = false;
        private boolean polymorphicDiscriminator = false;
        private boolean isXmlText = false;
        private String xmlPrefix;
        private Boolean requiredForCreate;

        /**
         * Sets the name of this property.
         * @param name the name of this property
         * @return the Builder itself
         */
        public Builder name(String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the description of this property.
         * @param description the description of this property
         * @return the Builder itself
         */
        public Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the arguments that go into this property's JsonProperty annotation.
         * @param annotationArguments the arguments that go into this property's JsonProperty annotation
         * @return the Builder itself
         */
        public Builder annotationArguments(String annotationArguments) {
            this.annotationArguments = annotationArguments;
            return this;
        }

        /**
         * Sets whether this property is an attribute when serialized to XML.
         * @param isXmlAttribute whether this property is an attribute when serialized to XML
         * @return the Builder itself
         */
        public Builder xmlAttribute(boolean isXmlAttribute) {
            this.isXmlAttribute = isXmlAttribute;
            return this;
        }

        /**
         * Sets this property's name when serialized to XML.
         * @param xmlName this property's name when serialized to XML
         * @return the Builder itself
         */
        public Builder xmlName(String xmlName) {
            this.xmlName = xmlName;
            return this;
        }

        /**
         * Sets this property's namespace when serialized to XML.
         * @param xmlNamespace this property's namespace when serialized to XML
         * @return the Builder itself
         */
        public Builder xmlNamespace(String xmlNamespace) {
            this.xmlNamespace = xmlNamespace;
            return this;
        }

        /**
         * Sets this property's name when it is serialized.
         * @param serializedName this property's name when it is serialized
         * @return the Builder itself
         */
        public Builder serializedName(String serializedName) {
            this.serializedName = serializedName;
            return this;
        }

        /**
         * Sets whether this property is a container.
         * @param isXmlWrapper whether this property is a container
         * @return the Builder itself
         */
        public Builder xmlWrapper(boolean isXmlWrapper) {
            this.isXmlWrapper = isXmlWrapper;
            return this;
        }

        /**
         * Sets the name of each list element tag within an XML list property.
         * @param xmlListElementName the name of each list element tag within an XML list property
         * @return the Builder itself
         */
        public Builder xmlListElementName(String xmlListElementName) {
            this.xmlListElementName = xmlListElementName;
            return this;
        }

        /**
         * Sets the namespace of each list element tag within an XML list property.
         * @param xmlListElementNamespace the namespace of each list element tag within an XML list property
         * @return the Builder itself
         */
        public Builder xmlListElementNamespace(String xmlListElementNamespace) {
            this.xmlListElementNamespace = xmlListElementNamespace;
            return this;
        }

        /**
         * Sets the prefix of each list element tag within an XML list property.
         * @param xmlListElementPrefix the prefix of each list element tag within an XML list property
         * @return the Builder itself
         */
        public Builder xmlListElementPrefix(String xmlListElementPrefix) {
            this.xmlListElementPrefix = xmlListElementPrefix;
            return this;
        }

        /**
         * Sets the type of this property as it is transmitted across the network (across the wire).
         * @param wireType the type of this property as it is transmitted across the network (across the wire)
         * @return the Builder itself
         */
        public Builder wireType(IType wireType) {
            this.wireType = wireType;
            return this;
        }

        /**
         * Sets the type of this property as it will be exposed via the client.
         * @param clientType the type of this property as it will be exposed via the client
         * @return the Builder itself
         */
        public Builder clientType(IType clientType) {
            this.clientType = clientType;
            return this;
        }

        /**
         * Sets whether this property has a constant value.
         * @param isConstant whether this property has a constant value
         * @return the Builder itself
         */
        public Builder constant(boolean isConstant) {
            this.isConstant = isConstant;
            return this;
        }

        /**
         * Sets the default value expression of this property.
         * @param defaultValue the default value expression of this property
         * @return the Builder itself
         */
        public Builder defaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets whether this property's value can be changed by the client library.
         * @param isReadOnly whether this property's value can be changed by the client library
         * @return the Builder itself
         */
        public Builder readOnly(boolean isReadOnly) {
            this.isReadOnly = isReadOnly;
            return this;
        }

        /**
         * Sets whether this property is required.
         * @param isRequired whether this property is required
         * @return the Builder itself
         */
        public Builder required(boolean isRequired) {
            this.isRequired = isRequired;
            return this;
        }

        /**
         * Sets whether this property is required when create the resource.
         * @param requiredForCreate whether this property is required when create the resource.
         * @return the Builder itself
         */
        public Builder requiredForCreate(boolean requiredForCreate) {
            this.requiredForCreate = requiredForCreate;
            return this;
        }

        /**
         * Sets the prefix of the headers that make up this property's values.
         * @param headerCollectionPrefix the prefix of the headers that make up this property's values
         * @return the Builder itself
         */
        public Builder headerCollectionPrefix(String headerCollectionPrefix) {
            this.headerCollectionPrefix = headerCollectionPrefix;
            return this;
        }

        /**
         * Sets whether this property contain the additional properties.
         * @param isAdditionalProperties whether this property contain the additional properties
         * @return the Builder itself
         */
        public Builder additionalProperties(boolean isAdditionalProperties) {
            this.isAdditionalProperties = isAdditionalProperties;
            return this;
        }

        /**
         * Sets list of property mutability.
         * @param mutabilities list of mutability.
         * @return the Builder itself
         */
        public Builder mutabilities(List<Mutability> mutabilities) {
            this.mutabilities = mutabilities;
            return this;
        }

        /**
         * Sets whether this property needs serialization flattening.
         *
         * Code will add <code>@JsonFlatten</code> annotation, and escape the <code>@JsonValue</code>.
         *
         * @param needsFlatten whether this property needs serialization flattening
         * @return the Builder itself
         */
        public Builder needsFlatten(boolean needsFlatten) {
            this.needsFlatten = needsFlatten;
            return this;
        }

        /**
         * Sets whether this property is required to be flattened.
         *
         * Code will make the accessors to the property <code>private</code> to hide them from user.
         *
         * @param clientFlatten whether this property is required to be flattened
         * @return the Builder itself
         */
        public Builder clientFlatten(boolean clientFlatten) {
            this.clientFlatten = clientFlatten;
            return this;
        }

        /**
         * Sets whether this property is a polymorphic discriminator.
         *
         * @param polymorphicDiscriminator Whether this property is a polymorphic discriminator.
         * @return the Builder itself
         */
        public Builder polymorphicDiscriminator(boolean polymorphicDiscriminator) {
            this.polymorphicDiscriminator = polymorphicDiscriminator;
            return this;
        }

        /**
         * Sets whether this property uses the value of an XML tag.
         *
         * @param isXmlText Whether this property uses the value of an XML tag.
         * @return the Builder itself
         */
        public Builder xmlText(boolean isXmlText) {
            this.isXmlText = isXmlText;
            return this;
        }

        /**
         * Sets the XML prefix for the property being constructed.
         *
         * @param xmlPrefix The XML prefix for the attribute or element the property represents.
         * @return the Builder itself
         */
        public Builder xmlPrefix(String xmlPrefix) {
            this.xmlPrefix = xmlPrefix;
            return this;
        }

        /**
         * Creates a new instance of Builder.
         */
        public Builder() {
        }

        private Builder(ClientModelProperty property) {
            this.name = property.getName();
            this.description = property.getDescription();
            this.annotationArguments = property.getAnnotationArguments();
            this.isXmlAttribute = property.isXmlAttribute();
            this.xmlName = property.getXmlName();
            this.xmlNamespace = property.getXmlNamespace();
            this.serializedName = property.getSerializedName();
            this.isXmlWrapper = property.isXmlWrapper();
            this.xmlListElementName = property.getXmlListElementName();
            this.xmlListElementNamespace = property.getXmlListElementNamespace();
            this.xmlListElementPrefix = property.getXmlListElementPrefix();
            this.wireType = property.getWireType();
            this.clientType = property.getClientType();
            this.isConstant = property.isConstant();
            this.defaultValue = property.getDefaultValue();
            this.isReadOnly = property.isReadOnly();
            this.mutabilities = property.getMutabilities();
            this.isRequired = property.isRequired();
            this.headerCollectionPrefix = property.getHeaderCollectionPrefix();
            this.isAdditionalProperties = property.isAdditionalProperties();
            this.needsFlatten = property.getNeedsFlatten();
            this.clientFlatten = property.getClientFlatten();
            this.polymorphicDiscriminator = property.isPolymorphicDiscriminator();
            this.isXmlText = property.isXmlText();
            this.xmlPrefix = property.getXmlPrefix();
            this.requiredForCreate = property.requiredForCreate;
        }

        public ClientModelProperty build() {
            return new ClientModelProperty(name, description, annotationArguments, isXmlAttribute, xmlName,
                xmlNamespace, serializedName, isXmlWrapper, xmlListElementName, xmlListElementNamespace,
                xmlListElementPrefix, wireType, clientType, isConstant, defaultValue, isReadOnly, mutabilities,
                isRequired, headerCollectionPrefix, isAdditionalProperties, needsFlatten, clientFlatten,
                polymorphicDiscriminator, isXmlText, xmlPrefix, requiredForCreate);
        }
    }
}
