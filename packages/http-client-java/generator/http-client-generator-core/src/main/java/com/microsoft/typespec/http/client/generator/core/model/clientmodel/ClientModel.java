// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * A model that is defined by the client.
 */
public class ClientModel {
    /**
     * The package that this model class belongs to.
     */
    private final String packageName;

    /**
     * Get the name of this model.
     */
    private final String name;

    private final String fullName;

    /**
     * Get the imports for this model.
     */
    private final List<String> imports;

    /**
     * Get the description of this model.
     */
    private final String description;

    /**
     * Get whether this model is part of a polymorphic hierarchy.
     */
    private final boolean isPolymorphic;

    /**
     * Get whether this model is a parent in a polymorphic hierarchy.
     */
    private final boolean isPolymorphicParent;

    /**
     * Get the properties used by parent models as polymorphic discriminators.
     */
    private final List<ClientModelProperty> parentPolymorphicDiscriminators;
    /**
     * Get the property that determines which polymorphic model type to create.
     */
    private final ClientModelProperty polymorphicDiscriminator;

    /**
     * Get the name of the property that determines which polymorphic model type to create.
     */
    private final String polymorphicDiscriminatorName;

    /**
     * Get the name that is used for this model when it is serialized.
     */
    private final String serializedName;

    /**
     * Get whether this model needs serialization flattening.
     */
    private final boolean needsFlatten;

    /**
     * Get the parent model of this model.
     */
    private final String parentModelName;

    /**
     * Get the models that derive from this model.
     */
    private final List<ClientModel> derivedModels;

    /**
     * Get the name that will be used for this model's XML element representation.
     */
    private final String xmlName;

    /**
     * The xml namespace for a model.
     */
    private final String xmlNamespace;

    /**
     * Get the properties for this model.
     */
    private final List<ClientModelProperty> properties;

    /**
     * Get the property references for this model. They are used to call property method from i.e. a parent model.
     */
    private final List<ClientModelPropertyReference> propertyReferences;

    /**
     * The type of the model.
     */
    private final IType modelType;

    /**
     * Whether this model is a strongly-typed HTTP headers class.
     */
    private final boolean stronglyTypedHeader;

    /**
     * The implementation details for the model.
     */
    private final ImplementationDetails implementationDetails;

    /**
     * Whether the model is used in XML serialization.
     */
    private final boolean usedInXml;

    private final Set<String> serializationFormats;

    /**
     * The cross language definition id for the model.
     */
    private final String crossLanguageDefinitionId;

    /**
     * Create a new ServiceModel with the provided properties.
     *
     * @param packageKeyword The package that this model class belongs to.
     * @param name The name of this model.
     * @param imports The imports for this model.
     * @param description The description of this model.
     * @param isPolymorphic Whether this model has model types that derive from it.
     * @param polymorphicDiscriminator The property that determines which polymorphic model type to create.
     * @param polymorphicDiscriminatorName The name of the property that determines which polymorphic model type to
     * create.
     * @param serializedName The name that is used for this model when it is serialized.
     * @param needsFlatten Whether this model needs serialization flattening.
     * @param parentModelName The parent model of this model.
     * @param derivedModels The models that derive from this model.
     * @param xmlName The name that will be used for this model's XML element representation.
     * @param xmlNamespace The XML namespace that will be used for this model's XML element representation.
     * @param properties The properties for this model.
     * @param propertyReferences The property references for this model.
     * @param modelType the type of the model.
     * @param stronglyTypedHeader Whether this model is a strongly-typed HTTP headers class.
     * @param implementationDetails The implementation details for the model.
     * @param usedInXml Whether the model is used in XML serialization.
     * @param crossLanguageDefinitionId The cross language definition id for the model.
     */
    protected ClientModel(String packageKeyword, String name, List<String> imports, String description,
        boolean isPolymorphic, ClientModelProperty polymorphicDiscriminator, String polymorphicDiscriminatorName,
        String serializedName, boolean needsFlatten, String parentModelName, List<ClientModel> derivedModels,
        String xmlName, String xmlNamespace, List<ClientModelProperty> properties,
        List<ClientModelPropertyReference> propertyReferences, IType modelType, boolean stronglyTypedHeader,
        ImplementationDetails implementationDetails, boolean usedInXml, Set<String> serializationFormats,
        String crossLanguageDefinitionId) {
        this.packageName = packageKeyword;
        this.name = name;
        this.fullName = packageName + "." + name;
        this.imports = imports;
        this.description = description;
        this.isPolymorphic = isPolymorphic;
        this.isPolymorphicParent = isPolymorphic && !CoreUtils.isNullOrEmpty(derivedModels);
        this.parentPolymorphicDiscriminators = new ArrayList<>();
        this.polymorphicDiscriminator = polymorphicDiscriminator;
        this.polymorphicDiscriminatorName = polymorphicDiscriminatorName;
        this.serializedName = serializedName;
        this.needsFlatten = needsFlatten;
        this.parentModelName = parentModelName;
        this.derivedModels = derivedModels;
        this.xmlName = xmlName;
        this.xmlNamespace = xmlNamespace;
        this.properties = properties;
        this.propertyReferences = propertyReferences;
        this.modelType = modelType;
        this.stronglyTypedHeader = stronglyTypedHeader;
        this.implementationDetails = implementationDetails;
        this.usedInXml = usedInXml;
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
        this.serializationFormats = serializationFormats;
    }

    /**
     * Get the cross language definition id for the model.
     *
     * @return the cross language definition id for the model.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Gets the package that this model class belongs to.
     *
     * @return The package that this model class belongs to.
     */
    public final String getPackage() {
        return packageName;
    }

    /**
     * Gets the name of this model.
     *
     * @return The name of this model.
     */
    public final String getName() {
        return name;
    }

    /**
     * Gets the fully qualified name of this model.
     *
     * @return The fully qualified name of this model.
     */
    public final String getFullName() {
        return fullName;
    }

    /**
     * Gets the imports for this model.
     *
     * @return The imports for this model.
     */
    public final List<String> getImports() {
        return imports;
    }

    /**
     * Gets the description of this model.
     *
     * @return The description of this model.
     */
    public final String getDescription() {
        return description;
    }

    /**
     * Gets whether this model is part of a polymorphic hierarchy.
     *
     * @return Whether this model is part of a polymorphic hierarchy.
     */
    public final boolean isPolymorphic() {
        return isPolymorphic;
    }

    /**
     * Gets whether this model is a parent in a polymorphic hierarchy.
     *
     * @return Whether this model is a parent in a polymorphic hierarchy.
     */
    public final boolean isPolymorphicParent() {
        return isPolymorphicParent;
    }

    /**
     * Gets the properties used by parent models as polymorphic discriminators.
     * <p>
     * The only time this will return a non-empty list is when this model is used in a multi-level polymorphic
     * hierarchy. Or, as an example, if the root model uses a polymorphic discriminator of {@code kind} and this model
     * uses a polymorphic discriminator of {@code type} this will have a single property where the serialized name is
     * {@code kind} and the default value for it will be what to root model uses to determine that this is the model
     * that should be deserialized. Continuing this example, the third level models, or those that are determined by the
     * {@code type} value, will also have a single property where the serialized name is {@code kind} and the default
     * value will be what the second level model uses to determine that this is the model that should be deserialized.
     * This is because the {@code kind} property will always need to be present for these models. If there are even
     * deeper levels of polymorphism, the same pattern will continue. So, if in the third level there is a model that
     * introduces another polymorphic discriminator of {@code format} that model would have two properties in this list,
     * one with {@code kind} with a default that determined the second level model and one with {@code type} with a
     * default that determined the third level model. The fourth level model would then have both as well.
     *
     * @return The properties used by parent models as polymorphic discriminators.
     */
    public final List<ClientModelProperty> getParentPolymorphicDiscriminators() {
        return parentPolymorphicDiscriminators;
    }

    /**
     * Gets the property that determines which polymorphic model type to create.
     *
     * @return The property that determines which polymorphic model type to create.
     */
    public final ClientModelProperty getPolymorphicDiscriminator() {
        return polymorphicDiscriminator;
    }

    /**
     * Gets the name of the property that determines which polymorphic model type to create.
     *
     * @return The name of the property that determines which polymorphic model type to create.
     */
    public final String getPolymorphicDiscriminatorName() {
        return polymorphicDiscriminatorName;
    }

    /**
     * Gets the name that is used for this model when it is serialized.
     *
     * @return The name that is used for this model when it is serialized.
     */
    public final String getSerializedName() {
        return serializedName;
    }

    /**
     * Gets whether this model needs serialization flattening.
     *
     * @return Whether this model needs serialization flattening.
     */
    public final boolean getNeedsFlatten() {
        return needsFlatten;
    }

    /**
     * Gets the parent model of this model.
     *
     * @return The parent model of this model.
     */
    public final String getParentModelName() {
        return parentModelName;
    }

    /**
     * Gets the models that derive from this model.
     *
     * @return The models that derive from this model.
     */
    public final List<ClientModel> getDerivedModels() {
        return derivedModels;
    }

    /**
     * Gets the name that will be used for this model's XML element representation.
     *
     * @return The name that will be used for this model's XML element representation.
     */
    public final String getXmlName() {
        return xmlName;
    }

    /**
     * Gets the XML namespace that will be used for this model's XML element representation.
     *
     * @return The XML namespace that will be used for this model's XML element representation.
     */
    public String getXmlNamespace() {
        return xmlNamespace;
    }

    /**
     * Gets the properties for this model.
     *
     * @return The properties for this model.
     */
    public final List<ClientModelProperty> getProperties() {
        return properties;
    }

    /**
     * Gets the type of the model.
     *
     * @return The type of the model.
     */
    public IType getType() {
        return modelType;
    }

    /**
     * Gets the property references for this model. They are used to call property method from i.e. a parent model.
     *
     * @return The property references for this model.
     */
    public List<ClientModelPropertyReference> getPropertyReferences() {
        return propertyReferences == null ? Collections.emptyList() : propertyReferences;
    }

    /**
     * Whether this model is a strongly-typed HTTP headers class.
     *
     * @return Whether this model is a strongly-typed HTTP headers class.
     */
    public boolean isStronglyTypedHeader() {
        return stronglyTypedHeader;
    }

    /**
     * Gets the implementation details for the model.
     *
     * @return The implementation details for the model.
     */
    public ImplementationDetails getImplementationDetails() {
        return implementationDetails;
    }

    /**
     * List the properties that have access (getter or setter) methods.
     * <p>
     * It does not include properties from superclass (even though they can be accessed via inheritance). It does not
     * include properties that only have private access (e.g. property of a flattened model). It includes properties
     * that can be accessed from the model but not declared in this model (e.g. properties from a flattened model).
     *
     * @return The properties that have access (getter or setter) methods.
     */
    public List<ClientModelPropertyAccess> getAccessibleProperties() {
        List<ClientModelPropertyAccess> propertyAccesses = new ArrayList<>();
        if (properties != null) {
            for (ClientModelProperty property : properties) {
                if (!property.getClientFlatten()) {
                    propertyAccesses.add(property);
                }
            }
        }

        for (ClientModelPropertyReference clientModelPropertyReference : getPropertyReferences()) {
            if (clientModelPropertyReference.isFromFlattenedProperty()) {
                propertyAccesses.add(clientModelPropertyReference);
            }
        }

        return propertyAccesses;
    }

    /**
     * Add this ServiceModel's imports to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     * @param settings The settings for this Java generator session.
     */
    public void addImportsTo(Set<String> imports, JavaSettings settings) {
        // whether annotated as Immutable or Fluent is also determined by its superclass
        imports.add(this.getFullName());
        addFluentAnnotationImport(imports);
        addImmutableAnnotationImport(imports);

        if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.TYPE
            && needsFlatten) {
            addJsonFlattenAnnotationImport(imports);
        }

        imports.addAll(getImports());

        if (isPolymorphic()) {
            imports.add("com.fasterxml.jackson.annotation.JsonTypeInfo");
            imports.add("com.fasterxml.jackson.annotation.JsonTypeName");

            if (getDerivedModels() != null && getDerivedModels().size() > 0) {
                imports.add("com.fasterxml.jackson.annotation.JsonSubTypes");
                getDerivedModels().forEach(m -> imports.add(m.getFullName()));
            }
        }

        for (ClientModelProperty property : getProperties()) {
            property.addImportsTo(imports, usedInXml);
        }
    }

    /**
     * Add the Fluent annotation import to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     */
    protected void addJsonFlattenAnnotationImport(Set<String> imports) {
        imports.add("com.azure.core.annotation.JsonFlatten");
    }

    /**
     * Add the Immutable annotation import to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     */
    protected void addImmutableAnnotationImport(Set<String> imports) {
        Annotation.IMMUTABLE.addImportsTo(imports);
        if (!JavaSettings.getInstance().isBranded()) {
            Annotation.TYPE_CONDITIONS.addImportsTo(imports);
            Annotation.METADATA.addImportsTo(imports);
        }
    }

    /**
     * Add the Fluent annotation import to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     */
    protected void addFluentAnnotationImport(Set<String> imports) {
        Annotation.FLUENT.addImportsTo(imports);
        if (!JavaSettings.getInstance().isBranded()) {
            Annotation.METADATA.addImportsTo(imports);
        }
    }

    /**
     * Whether the model is used in XML serialization.
     *
     * @return Whether the model is used in XML serialization.
     */
    public final boolean isUsedInXml() {
        return usedInXml;
    }

    /**
     * Gets the Set of serialization format of the model.
     *
     * @return the Set of serialization format of the model.
     */
    public Set<String> getSerializationFormats() {
        return serializationFormats;
    }

    /**
     * A builder for building a new ClientModel.
     */
    public static class Builder {
        protected String packageName;
        protected String name;
        protected List<String> imports = Collections.emptyList();
        protected String description;
        protected boolean isPolymorphic;
        protected ClientModelProperty polymorphicDiscriminator;
        protected String polymorphicDiscriminatorName;
        protected String serializedName;
        protected boolean needsFlatten = false;
        protected String parentModelName;
        protected List<ClientModel> derivedModels = Collections.emptyList();
        protected String xmlName;
        protected List<ClientModelProperty> properties;
        protected String xmlNamespace;
        protected List<ClientModelPropertyReference> propertyReferences;
        protected IType modelType;
        protected boolean stronglyTypedHeader;
        protected ImplementationDetails implementationDetails;
        protected boolean usedInXml;
        protected String crossLanguageDefinitionId;
        protected Set<String> serializationFormats = Collections.emptySet();

        /**
         * Sets the package that this model class belongs to.
         *
         * @param packageName the package that this model class belongs to
         * @return the Builder itself
         */
        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        /**
         * Sets the name of this model.
         *
         * @param name the name of this model
         * @return the Builder itself
         */
        public Builder name(String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the imports for this model.
         *
         * @param imports the imports for this model
         * @return the Builder itself
         */
        public Builder imports(List<String> imports) {
            this.imports = imports;
            return this;
        }

        /**
         * Sets the description of this model.
         *
         * @param description the description of this model
         * @return the Builder itself
         */
        public Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets whether this model has model types that derive from it.
         *
         * @param isPolymorphic whether this model has model types that derive from it
         * @return the Builder itself
         */
        public Builder polymorphic(boolean isPolymorphic) {
            this.isPolymorphic = isPolymorphic;
            return this;
        }

        /**
         * Sets the property that determines which polymorphic model type to create.
         *
         * @param polymorphicDiscriminator the property that determines which polymorphic model type to create
         * @return the Builder itself
         */
        public Builder polymorphicDiscriminator(ClientModelProperty polymorphicDiscriminator) {
            this.polymorphicDiscriminator = polymorphicDiscriminator;
            return this;
        }

        public Builder polymorphicDiscriminatorName(String polymorphicDiscriminatorName) {
            this.polymorphicDiscriminatorName = polymorphicDiscriminatorName;
            return this;
        }

        /**
         * Sets the name that is used for this model when it is serialized.
         *
         * @param serializedName the name that is used for this model when it is serialized
         * @return the Builder itself
         */
        public Builder serializedName(String serializedName) {
            this.serializedName = serializedName;
            return this;
        }

        /**
         * Sets whether this model needs serialization flattening.
         *
         * @param needsFlatten whether this model needs serialization flattening
         * @return the Builder itself
         */
        public Builder needsFlatten(boolean needsFlatten) {
            this.needsFlatten = needsFlatten;
            return this;
        }

        /**
         * Sets the parent model of this model.
         *
         * @param parentModelName the parent model of this model
         * @return the Builder itself
         */
        public Builder parentModelName(String parentModelName) {
            this.parentModelName = parentModelName;
            return this;
        }

        /**
         * Sets the models that derive from this model.
         *
         * @param derivedModels the models that derive from this model
         * @return the Builder itself
         */
        public Builder derivedModels(List<ClientModel> derivedModels) {
            this.derivedModels = derivedModels;
            return this;
        }

        /**
         * Sets the name that will be used for this model's XML element representation.
         *
         * @param xmlName the name that will be used for this model's XML element representation
         * @return the Builder itself
         */
        public Builder xmlName(String xmlName) {
            this.xmlName = xmlName;
            return this;
        }

        /**
         * Sets the XML namespace that will be used for this model's XML element representation.
         *
         * @param xmlNamespace the XML namespace that will be used for this model's XML element representation
         * @return the Builder itself
         */
        public Builder xmlNamespace(String xmlNamespace) {
            this.xmlNamespace = xmlNamespace;
            return this;
        }

        /**
         * Sets the properties for this model.
         *
         * @param properties the properties for this model
         * @return the Builder itself
         */
        public Builder properties(List<ClientModelProperty> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Sets the property references for this model. They are used to call property method from i.e. a parent model.
         *
         * @param propertyReferences the property references.
         * @return the Builder itself
         */
        public Builder propertyReferences(List<ClientModelPropertyReference> propertyReferences) {
            this.propertyReferences = propertyReferences;
            return this;
        }

        /**
         * Sets the model type.
         *
         * @param modelType the model type.
         * @return the Builder itself
         */
        public Builder type(IType modelType) {
            this.modelType = modelType;
            return this;
        }

        /**
         * Sets whether the model is a strongly-typed HTTP headers class.
         *
         * @param stronglyTypedHeader Whether the model is a strongly-typed HTTP headers class.
         * @return the Builder itself
         */
        public Builder stronglyTypedHeader(boolean stronglyTypedHeader) {
            this.stronglyTypedHeader = stronglyTypedHeader;
            return this;
        }

        /**
         * Sets the implementation details for the model.
         *
         * @param implementationDetails the implementation details.
         * @return the Builder itself
         */
        public Builder implementationDetails(ImplementationDetails implementationDetails) {
            this.implementationDetails = implementationDetails;
            return this;
        }

        /**
         * Sets whether the model is used in XML serialization.
         *
         * @param usedInXml Whether the model is used in XML serialization.
         * @return the Builder itself
         */
        public Builder usedInXml(boolean usedInXml) {
            this.usedInXml = usedInXml;
            return this;
        }

        /**
         * Sets the cross language definition id for the model.
         *
         * @param crossLanguageDefinitionId the cross language definition id for the model.
         * @return the Builder itself
         */
        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }

        /**
         * Sets the Set of serialization format of this model.
         *
         * @param serializationFormats the Set of serialization format of this model.
         * @return the Builder itself
         */
        public Builder serializationFormats(Set<String> serializationFormats) {
            this.serializationFormats = serializationFormats == null ? Collections.emptySet() : serializationFormats;
            return this;
        }

        /**
         * Build a new ClientModel instance with the provided properties.
         *
         * @return a new ClientModel instance with the provided properties
         */
        public ClientModel build() {
            return new ClientModel(packageName, name, imports, description, isPolymorphic, polymorphicDiscriminator,
                polymorphicDiscriminatorName, serializedName, needsFlatten, parentModelName, derivedModels, xmlName,
                xmlNamespace, properties, propertyReferences, modelType, stronglyTypedHeader, implementationDetails,
                usedInXml, serializationFormats, crossLanguageDefinitionId);
        }
    }
}
