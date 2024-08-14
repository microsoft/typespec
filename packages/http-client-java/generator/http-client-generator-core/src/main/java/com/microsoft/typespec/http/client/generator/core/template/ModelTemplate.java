// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelPropertyAccess;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelPropertyReference;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaIfBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.util.ModelTemplateHeaderHelper;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.http.HttpHeader;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.logging.ClientLogger;
import com.azure.core.util.serializer.JacksonAdapter;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Writes a ClientModel to a JavaFile.
 */
public class ModelTemplate implements IJavaTemplate<ClientModel, JavaFile> {

    private static final String MISSING_SCHEMA = "MISSING·SCHEMA";
    private static final ModelTemplate INSTANCE = new ModelTemplate();

    protected ModelTemplate() {
    }

    public static ModelTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(ClientModel model, JavaFile javaFile) {
        if (model.getParentModelName() != null && model.getParentModelName().equals(model.getName())) {
            throw new IllegalStateException("Parent model name is same as model name: " + model.getName());
        }

        final boolean requireSerialization = modelRequireSerialization(model);

        JavaSettings settings = JavaSettings.getInstance();
        Set<String> imports = settings.isStreamStyleSerialization() ? new StreamStyleImports() : new HashSet<>();

        addImports(imports, model, settings);

        List<ClientModelPropertyReference> propertyReferences = this.getClientModelPropertyReferences(model);
        propertyReferences.forEach(p -> p.addImportsTo(imports, false));

        if (!CoreUtils.isNullOrEmpty(model.getPropertyReferences())) {
            if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.NONE) {
                model.getPropertyReferences().forEach(p -> p.addImportsTo(imports, false));
            }
            propertyReferences.addAll(model.getPropertyReferences());
        }

        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> comment.description(model.getDescription()));

        final boolean hasDerivedModels = !model.getDerivedModels().isEmpty();
        final boolean immutableModel = isImmutableOutputModel(model, settings);
        boolean treatAsXml = model.isUsedInXml();

        // Handle adding annotations if the model is polymorphic.
        handlePolymorphism(model, hasDerivedModels, javaFile);

        // Add class level annotations for serialization formats such as XML.
        addClassLevelAnnotations(model, javaFile, settings);

        // Add Fluent or Immutable based on whether the model has any setters.
        addFluentOrImmutableAnnotation(model, immutableModel, propertyReferences, javaFile, settings);

        List<JavaModifier> classModifiers = null;
        if (!hasDerivedModels && !model.getNeedsFlatten()) {
            classModifiers = Collections.singletonList(JavaModifier.Final);
        }

        String classNameWithBaseType = model.getName();
        if (model.getParentModelName() != null) {
            classNameWithBaseType += " extends " + model.getParentModelName();
        } else if (requireSerialization) {
            classNameWithBaseType = addSerializationImplementations(classNameWithBaseType, model, settings);
        }

        javaFile.publicClass(classModifiers, classNameWithBaseType, classBlock -> {
            // If the model has any additional properties, needs to be flattened, and isn't being generated with
            // stream-style serialization add a constant Pattern that will be used to escape the additional property
            // keys. Certain versions of the JVM will compile a Pattern each time '.replace' is called which is very
            // expensive.
            if (model.getProperties().stream().anyMatch(ClientModelProperty::isAdditionalProperties)
                && model.getNeedsFlatten()
                && !settings.isStreamStyleSerialization()) {
                addGeneratedAnnotation(classBlock);
                classBlock.privateStaticFinalVariable("Pattern KEY_ESCAPER = Pattern.compile(\"\\\\.\");");
            }

            // If code is being generated with the behavior to return an empty byte array when the default value
            // expression is null and the model has any array types that will need conversion within getter methods
            // generate a static byte[] that will be returned instead of creating a new instance each get.
            if (isGenerateConstantEmptyByteArray(model, settings)) {
                classBlock.privateStaticFinalVariable("byte[] EMPTY_BYTE_ARRAY = new byte[0]");
            }

            // XML namespace constants
            addXmlNamespaceConstants(model, classBlock);

            // properties
            addProperties(model, classBlock, settings);

            // add jsonMergePatch related properties and accessors
            if (ClientModelUtil.isJsonMergePatchModel(model, settings)) {
                addJsonMergePatchRelatedPropertyAndAccessors(classBlock, model);
            }

            // constructor
            JavaVisibility modelConstructorVisibility = immutableModel
                ? (hasDerivedModels ? JavaVisibility.Protected : JavaVisibility.Private)
                : JavaVisibility.Public;
            addModelConstructor(model, modelConstructorVisibility, settings, classBlock);

            for (ClientModelProperty property : getFieldProperties(model, settings)) {
                final boolean propertyIsReadOnly = immutableModel || property.isReadOnly();

                IType propertyWireType = property.getWireType();
                IType propertyClientType = propertyWireType.getClientType();

                JavaVisibility methodVisibility = property.getClientFlatten()
                    ? JavaVisibility.Private
                    : JavaVisibility.Public;

                generateGetterJavadoc(classBlock, property);
                addGeneratedAnnotation(classBlock);
                if (property.isAdditionalProperties() && !settings.isStreamStyleSerialization()) {
                    classBlock.annotation("JsonAnyGetter");
                }
                if (!propertyIsReadOnly) {
                    TemplateUtil.addJsonGetter(classBlock, settings, property.getSerializedName());
                }

                boolean overridesParentGetter = overridesParentGetter(model, property, settings, methodVisibility);
                if (overridesParentGetter) {
                    classBlock.annotation("Override");
                }
                classBlock.method(methodVisibility, null,
                    propertyClientType + " " + getGetterName(model, property) + "()",
                    methodBlock -> addGetterMethod(propertyWireType, propertyClientType, property, treatAsXml,
                            methodBlock, settings));

                if (ClientModelUtil.needsPublicSetter(property, settings) && !immutableModel) {
                    generateSetterJavadoc(classBlock, model, property);
                    addGeneratedAnnotation(classBlock);
                    TemplateUtil.addJsonSetter(classBlock, settings, property.getSerializedName());
                    classBlock.method(methodVisibility, null,
                        model.getName() + " " + property.getSetterName() + "(" + propertyClientType + " " + property.getName() + ")",
                        methodBlock -> addSetterMethod(propertyWireType, propertyClientType, property, treatAsXml,
                            methodBlock, settings, ClientModelUtil.isJsonMergePatchModel(model, settings)));
                } else {
                    // If stream-style serialization is being generated, some additional setters may need to be added to
                    // support read-only properties that aren't included in the constructor.
                    // Jackson handles this by reflectively setting the value in the parent model, but stream-style
                    // serialization doesn't perform reflective cracking like Jackson Databind does, so it needs a way
                    // to access the readonly property (aka one without a public setter method).
                    //
                    // The package-private setter is added when the property isn't included in the constructor and is
                    // defined by this model, except for JSON merge patch models as those use the access helper pattern
                    // to enable subtypes to set the property.
                    boolean streamStyle = settings.isStreamStyleSerialization();
                    boolean hasDerivedTypes = !CoreUtils.isNullOrEmpty(model.getDerivedModels());
                    boolean notIncludedInConstructor = !ClientModelUtil.includePropertyInConstructor(property,
                        settings);
                    boolean definedByModel = modelDefinesProperty(model, property);
                    boolean modelIsJsonMergePatch = ClientModelUtil.isJsonMergePatchModel(model, settings);
                    if (hasDerivedTypes && notIncludedInConstructor && definedByModel
                        && streamStyle && !property.isPolymorphicDiscriminator() && !modelIsJsonMergePatch) {
                        generateSetterJavadoc(classBlock, model, property);
                        addGeneratedAnnotation(classBlock);
                        classBlock.method(JavaVisibility.PackagePrivate, null,
                            model.getName() + " " + property.getSetterName() + "(" + propertyClientType + " "
                                + property.getName() + ")",
                            methodBlock -> addSetterMethod(propertyWireType, propertyClientType, property, treatAsXml,
                                methodBlock, settings,
                                ClientModelUtil.isJsonMergePatchModel(model, settings)));
                    }
                }

                // If the property is additional properties, and stream-style serialization isn't being used, add a
                // package-private setter that Jackson can use to set values as it deserializes the key-value pairs.
                if (property.isAdditionalProperties() && !settings.isStreamStyleSerialization()) {
                    addGeneratedAnnotation(classBlock);
                    classBlock.annotation("JsonAnySetter");
                    MapType mapType = (MapType) property.getClientType();
                    String methodSignature = "void " + property.getSetterName() + "(String key, "
                        + mapType.getValueType() + " value)";
                    classBlock.packagePrivateMethod(methodSignature, methodBlock -> {
                        // The additional properties are null by default, so if this is the first time the value is
                        // being added create the containing map.
                        methodBlock.ifBlock(property.getName() + " == null",
                            ifBlock -> ifBlock.line(property.getName() + " = new LinkedHashMap<>();"));

                        String key = model.getNeedsFlatten() ? "KEY_ESCAPER.matcher(key).replaceAll(\".\")" : "key";
                        methodBlock.line(property.getName() + ".put(" + key + ", value);");
                    });
                }
            }

            // add setters to override parent setters
            if (!immutableModel) {
                List<ClientModelPropertyAccess> settersToOverride = getSuperSetters(model, settings,
                    propertyReferences);
                for (ClientModelPropertyAccess parentProperty : settersToOverride) {
                    classBlock.javadocComment(JavaJavadocComment::inheritDoc);
                    addGeneratedAnnotation(classBlock);
                    classBlock.annotation("Override");
                    String methodSignature = model.getName() + " " + parentProperty.getSetterName() + "("
                        + parentProperty.getClientType() + " " + parentProperty.getName() + ")";

                    classBlock.publicMethod(methodSignature, methodBlock -> {
                        methodBlock.line(
                            "super." + parentProperty.getSetterName() + "(" + parentProperty.getName() + ");");
                        if (ClientModelUtil.isJsonMergePatchModel(model, settings)) {
                            methodBlock.line("this.updatedProperties.add(\"" + parentProperty.getName() + "\");");
                        }
                        methodBlock.methodReturn("this");
                    });
                }
            }

            if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.NONE) {
                // reference to properties from flattened client model
                for (ClientModelPropertyReference propertyReference : propertyReferences) {
                    propertyReference = getLocalFlattenedModelPropertyReference(propertyReference);
                    if (propertyReference == null) {
                        continue;
                    }

                    ClientModelPropertyAccess property = propertyReference.getReferenceProperty();
                    ClientModelProperty targetProperty = propertyReference.getTargetProperty();

                    IType propertyClientType = property.getClientType();
                    final boolean propertyIsReadOnly = immutableModel || property.isReadOnly();

                    if (propertyClientType instanceof PrimitiveType && !targetProperty.isRequired()) {
                        // since the property to flattened client model is optional, the flattened property should be optional
                        propertyClientType = propertyClientType.asNullable();
                    }
                    final IType propertyClientTypeFinal = propertyClientType;

                    // getter
                    generateGetterJavadoc(classBlock, property);
                    addGeneratedAnnotation(classBlock);
                    classBlock.publicMethod(propertyClientType + " " + propertyReference.getGetterName() + "()", methodBlock -> {
                        // use ternary operator to avoid directly return null
                        String ifClause = "this." + targetProperty.getGetterName() + "() == null";
                        String nullClause = propertyClientTypeFinal.defaultValueExpression();
                        String valueClause = "this." + targetProperty.getGetterName() + "()." + property.getGetterName() + "()";

                        methodBlock.methodReturn(ifClause + " ? " + nullClause + " : " + valueClause);
                    });

                    // setter
                    if (!propertyIsReadOnly) {
                        generateSetterJavadoc(classBlock, model, property);
                        addGeneratedAnnotation(classBlock);
                        ClientModelPropertyReference propertyReferenceFinal = propertyReference;
                        classBlock.publicMethod(String.format("%s %s(%s %s)", model.getName(), propertyReference.getSetterName(), propertyClientType, property.getName()), methodBlock -> {
                            methodBlock.ifBlock(String.format("this.%s() == null", targetProperty.getGetterName()), ifBlock ->
                                methodBlock.line(String.format("this.%s = new %s();", targetProperty.getName(), propertyReferenceFinal.getTargetModelType())));

                            methodBlock.line(String.format("this.%s().%s(%s);", targetProperty.getGetterName(), property.getSetterName(), property.getName()));
                            methodBlock.methodReturn("this");
                        });
                    }
                }
            }

            addPropertyValidations(classBlock, model, settings);

            if ((settings.isClientSideValidations() && settings.isUseClientLogger()) || model.isStronglyTypedHeader()) {
                TemplateUtil.addClientLogger(classBlock, model.getName(), javaFile.getContents());
            }

            if (requireSerialization) {
                writeStreamStyleSerialization(classBlock, model, settings);
            }
        });
    }

    /**
     * Get the property reference referring to the local(field) flattened property.
     *
     * @param propertyReference propertyReference to check
     * @return the property reference referring to the local(field) flattened property, null if it's not
     */
    protected ClientModelPropertyReference getLocalFlattenedModelPropertyReference(ClientModelPropertyReference propertyReference) {
        if (propertyReference.isFromFlattenedProperty()) {
            return propertyReference;
        }
        // Not a flattening property, return null.
        return null;
    }

    /**
     * Whether the property's getter overrides parent getter.
     *
     * @param model            the client model
     * @param property         the property to generate getter method
     * @param settings         {@link JavaSettings} instance
     * @param methodVisibility
     * @return whether the property's getter overrides parent getter
     */
    protected boolean overridesParentGetter(ClientModel model, ClientModelProperty property, JavaSettings settings, JavaVisibility methodVisibility) {
        // getter method of discriminator property in subclass is handled differently
        return property.isPolymorphicDiscriminator() && !modelDefinesProperty(model, property) && methodVisibility == JavaVisibility.Public;
    }
    /**
     * The model is immutable output if and only if the immutable output model setting is enabled and
     * the usage of the model include output and does not include input.
     *
     * @param model the model to check
     * @param settings JavaSettings instance
     * @return whether the model is output-only immutable model
     */
    static boolean isImmutableOutputModel(ClientModel model, JavaSettings settings) {
        return (settings.isOutputModelImmutable() && ClientModelUtil.isOutputOnly(model));
    }

    private void addImports(Set<String> imports, ClientModel model, JavaSettings settings) {
        // If there is client side validation and the model will generate a ClientLogger to log the validation
        // exceptions add an import of 'com.azure.core.util.logging.ClientLogger' and
        // 'com.fasterxml.jackson.annotation.JsonIgnore'.
        //
        // These are added to support adding the ClientLogger and then to JsonIgnore the ClientLogger so it isn't
        // included in serialization.
        if (settings.isClientSideValidations() && settings.isUseClientLogger()) {
            ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        }

        addSerializationImports(imports, model, settings);

        // Add HttpHeaders as an import when strongly-typed HTTP header objects use that as a constructor parameter.
        if (model.isStronglyTypedHeader()) {
            ClassType.HTTP_HEADERS.addImportsTo(imports, false);
            ClassType.HTTP_HEADER_NAME.addImportsTo(imports, false);

            // Also add any potential imports needed to convert the header to the strong type.
            // If the import isn't used it will be removed later on.
            imports.add(Base64.class.getName());
            imports.add(LinkedHashMap.class.getName());
            imports.add(HttpHeader.class.getName());
            imports.add(UUID.class.getName());
            imports.add(URL.class.getName());
            imports.add(IOException.class.getName());
            imports.add(UncheckedIOException.class.getName());
            imports.add(ClientLogger.class.getName());

            // JacksonAdapter will be removed in the future once model types are converted to using stream-style
            // serialization. For now, it's needed to handle the rare scenario where the strong type is a non-Java
            // base type.
            imports.add(JacksonAdapter.class.getName());
        }

        String lastParentName = model.getName();
        ClientModel parentModel = ClientModelUtil.getClientModel(model.getParentModelName());
        while (parentModel != null && !lastParentName.equals(parentModel.getName())) {
            imports.addAll(parentModel.getImports());
            lastParentName = parentModel.getName();
            parentModel = ClientModelUtil.getClientModel(parentModel.getParentModelName());
        }

        addGeneratedImport(imports);

        model.addImportsTo(imports, settings);

        // add Json merge patch related imports
        if (ClientModelUtil.isJsonMergePatchModel(model, settings)) {
            imports.add(settings.getPackage(settings.getImplementationSubpackage()) + "." + ClientModelUtil.JSON_MERGE_PATCH_HELPER_CLASS_NAME);
            imports.add(Set.class.getName());
            imports.add(HashSet.class.getName());
        }
    }

    protected void addSerializationImports(Set<String> imports, ClientModel model, JavaSettings settings) {
        imports.add("com.fasterxml.jackson.annotation.JsonCreator");

        if (settings.isGettersAndSettersAnnotatedForSerialization()) {
            imports.add("com.fasterxml.jackson.annotation.JsonGetter");
            imports.add("com.fasterxml.jackson.annotation.JsonSetter");
        }

        imports.add(Pattern.class.getName());
    }

    /**
     * We generate super setters in child class if all of below conditions are met:
     * 1. parent property has setter
     * 2. child does not contain property that shadow this parent property, otherwise super setters
     * will collide with child setters
     *
     * @see <a href="https://github.com/Azure/autorest.java/issues/1320">Issue 1320</a>
     */
    protected List<ClientModelPropertyAccess> getSuperSetters(ClientModel model, JavaSettings settings,
                                                              List<ClientModelPropertyReference> propertyReferences) {
        Set<String> modelPropertyNames = model.getProperties().stream().map(ClientModelProperty::getName)
            .collect(Collectors.toSet());
        return propertyReferences.stream()
            .filter(ClientModelPropertyReference::isFromParentModel)
            .map(ClientModelPropertyReference::getReferenceProperty)
            .filter(parentProperty -> {
                    // parent property doesn't have setter
                    if (!ClientModelUtil.needsPublicSetter(parentProperty, settings)) {
                        return false;
                    }
                    // child does not contain property that shadow this parent property
                    return !modelPropertyNames.contains(parentProperty.getName());
                }
            ).collect(Collectors.toList());
    }

    /**
     * Handles setting up Jackson polymorphism annotations.
     *
     * @param model The client model.
     * @param hasDerivedModels Whether this model has children types.
     * @param javaFile The JavaFile being generated.
     */
    protected void handlePolymorphism(ClientModel model, boolean hasDerivedModels, JavaFile javaFile) {
        // Model isn't polymorphic, no work to do here.
        if (!model.isPolymorphic()) {
            return;
        }

        // After removing the concept of passing discriminator to children models and always doing it, there is no need
        // to set the 'include' property of the JsonTypeInfo annotation. We use 'JsonTypeInfo.As.PROPERTY' as the value,
        // which is the default value, so it doesn't need to be declared.
        // And to support unknown subtypes, we always set a default implementation to the class being generated.
        // And the discriminator is passed to child models, so the discriminator property needs to be set to visible.
        String jsonTypeInfo = "JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = \""
            + model.getPolymorphicDiscriminatorName() + "\", defaultImpl = " + model.getName()
            + ".class, visible = true)";

        javaFile.annotation(jsonTypeInfo);
        javaFile.annotation("JsonTypeName(\"" + model.getSerializedName() + "\")");

        if (hasDerivedModels) {
            javaFile.line("@JsonSubTypes({");
            javaFile.indent(() -> {
                Function<ClientModel, String> getDerivedTypeAnnotation = derivedType -> "@JsonSubTypes.Type(name = \""
                    + derivedType.getSerializedName() + "\", value = " + derivedType.getName() + ".class)";

                for (int i = 0; i != model.getDerivedModels().size() - 1; i++) {
                    ClientModel derivedModel = model.getDerivedModels().get(i);
                    javaFile.line(getDerivedTypeAnnotation.apply(derivedModel) + ',');
                }
                javaFile.line(getDerivedTypeAnnotation.apply(model.getDerivedModels()
                    .get(model.getDerivedModels().size() - 1)));
            });
            javaFile.line("})");
        }
    }

    /**
     * Adds class level annotations such as XML root element, JsonFlatten based on the configurations of the model.
     *
     * @param model The client model.
     * @param javaFile The Java class file.
     * @param settings Autorest generation settings.
     */
    protected void addClassLevelAnnotations(ClientModel model, JavaFile javaFile, JavaSettings settings) {
        if (model.isUsedInXml()) {
            if (!CoreUtils.isNullOrEmpty(model.getXmlNamespace())) {
                javaFile.annotation("JacksonXmlRootElement(localName = \"" + model.getXmlName() + "\", "
                    + "namespace = \"" + model.getXmlNamespace() + "\")");
            } else {
                javaFile.annotation("JacksonXmlRootElement(localName = \"" + model.getXmlName() + "\")");
            }
        }

        if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.TYPE
            && model.getNeedsFlatten()) {
            javaFile.annotation("JsonFlatten");
        }
    }

    /**
     * Adds Fluent or Immutable based on whether model has any setters.
     *
     * @param model The client model.
     * @param immutableOutputModel The model is treated as immutable, as it is output only.
     * @param propertyReferences The client model property reference.
     * @param javaFile The Java class file.
     * @param settings Autorest generation settings.
     */
    private void addFluentOrImmutableAnnotation(ClientModel model, boolean immutableOutputModel,
        List<ClientModelPropertyReference> propertyReferences, JavaFile javaFile, JavaSettings settings) {
        boolean fluent = !immutableOutputModel && Stream
            .concat(model.getProperties().stream(), propertyReferences.stream())
            .anyMatch(p -> ClientModelUtil.needsPublicSetter(p, settings));

        if (JavaSettings.getInstance().isBranded()) {
            if (fluent) {
                javaFile.annotation("Fluent");
            } else {
                javaFile.annotation("Immutable");
            }
        } else {
            if (fluent) {
                javaFile.annotation("Metadata(conditions = {TypeConditions.FLUENT})");
            } else {
                javaFile.annotation("Metadata(conditions = {TypeConditions.IMMUTABLE})");
            }
        }
    }

    /**
     * Adds serialization implementations to the class signature.
     *
     * @param classSignature The class signature.
     * @param model The client model.
     * @param settings Autorest generation settings.
     * @return The updated class signature with serialization implementations added.
     */
    protected String addSerializationImplementations(String classSignature, ClientModel model, JavaSettings settings) {
        // no-op as this is an entry point for subclasses of ModelTemplate that provide more specific code generation.
        return classSignature;
    }

    protected void addXmlNamespaceConstants(ClientModel model, JavaClass classBlock) {
        // no-op as this is an entry point for subclasses of ModelTemplate that provide more specific code generation.
    }

    /**
     * Adds the property fields to a class.
     *
     * @param model The client model.
     * @param classBlock The Java class.
     * @param settings AutoRest configuration settings.
     */
    private void addProperties(ClientModel model, JavaClass classBlock, JavaSettings settings) {
        for (ClientModelProperty property : getFieldProperties(model, settings)) {
            addProperty(property, model, classBlock, settings);
        }
    }

    private void addProperty(ClientModelProperty property, ClientModel model, JavaClass classBlock,
        JavaSettings settings) {
        String propertyName = property.getName();
        IType propertyType = property.getWireType();

        String defaultValue;
        if (property.isPolymorphicDiscriminator()) {
            defaultValue = (property.getDefaultValue() == null)
                ? property.getClientType().defaultValueExpression(model.getSerializedName())
                : property.getDefaultValue();
        } else {
            defaultValue = property.getDefaultValue();
        }

        String fieldSignature;
        if (model.isUsedInXml()) {
            if (property.isXmlWrapper()) {
                if (!settings.isStreamStyleSerialization()) {
                    String xmlWrapperClassName = getPropertyXmlWrapperClassName(property);
                    classBlock.staticFinalClass(JavaVisibility.PackagePrivate, xmlWrapperClassName,
                        innerClass -> addXmlWrapperClass(innerClass, property, xmlWrapperClassName, settings));

                    fieldSignature = xmlWrapperClassName + " " + propertyName;
                } else {
                    fieldSignature = propertyType + " " + propertyName;
                }
            } else if (propertyType instanceof ListType) {
                fieldSignature = propertyType + " " + propertyName + " = new ArrayList<>()";
            } else {
                // handle x-ms-client-default
                // Only set the property to a default value if the property isn't included in the constructor.
                // There can be cases with polymorphic discriminators where they have both a default value and are
                // required, in which case the default value will be set in the constructor.
                if (defaultValue != null
                    && (!ClientModelUtil.includePropertyInConstructor(property, settings) || property.isConstant())) {
                    fieldSignature = propertyType + " " + propertyName + " = " + defaultValue;
                } else {
                    fieldSignature = propertyType + " " + propertyName;
                }
            }
        } else {
            if (property.getClientFlatten() && property.isRequired() && property.getClientType() instanceof ClassType
                    && !isImmutableOutputModel(
                            getDefiningModel(
                                ClientModelUtil.getClientModel(((ClassType) property.getClientType()).getName()), property),
                                settings)
            ) {
                // if the property of flattened model is required, and isn't immutable output model(which doesn't have public constructor),
                // initialize it
                fieldSignature = propertyType + " " + propertyName + " = new " + propertyType + "()";
            } else {
                // handle x-ms-client-default
                // Only set the property to a default value if the property isn't included in the constructor.
                // There can be cases with polymorphic discriminators where they have both a default value and are
                // required, in which case the default value will be set in the constructor.
                if (defaultValue != null
                    && (!ClientModelUtil.includePropertyInConstructor(property, settings) || property.isConstant())) {
                    fieldSignature = propertyType + " " + propertyName + " = " + defaultValue;
                } else {
                    fieldSignature = propertyType + " " + propertyName;
                }
            }
        }

        classBlock.blockComment(comment -> comment.line(property.getDescription()));

        addGeneratedAnnotation(classBlock);
        addFieldAnnotations(model, property, classBlock, settings);

        if (ClientModelUtil.includePropertyInConstructor(property, settings)) {
            classBlock.privateFinalMemberVariable(fieldSignature);
        } else {
            classBlock.privateMemberVariable(fieldSignature);
        }
    }

    /**
     * Get properties to generate as fields of the class.
     * @param model the model to generate class of
     * @param settings JavaSettings
     * @return properties to generate as fields of the class
     */
    protected List<ClientModelProperty> getFieldProperties(ClientModel model, JavaSettings settings) {
        return Stream.concat(
            model.getParentPolymorphicDiscriminators().stream(),
            model.getProperties().stream()
        ).collect(Collectors.toList());
    }

    protected void addXmlWrapperClass(JavaClass classBlock, ClientModelProperty property, String wrapperClassName,
        JavaSettings settings) {
        // While using a wrapping class for XML elements that are wrapped may seem inconvenient it is required.
        // There has been previous attempts to remove this by using JacksonXmlElementWrapper, which based on its
        // documentation should cover this exact scenario, but it doesn't. Jackson unfortunately doesn't always
        // respect the JacksonXmlRootName, or JsonRootName, value when handling types wrapped by an enumeration,
        // such as List<CorsRule> or Iterable<CorsRule>. Instead, it uses the JacksonXmlProperty local name as the
        // root XML node name for each element in the enumeration. There are configurations for ObjectMapper, and
        // XmlMapper, that always forces Jackson to use the root name but those also add the class name as a root
        // XML node name if the class doesn't have a root name annotation which results in an addition XML level
        // resulting in invalid service XML. There is also one last work around to use JacksonXmlElementWrapper
        // and JacksonXmlProperty together as the wrapper will configure the wrapper name and property will configure
        // the element name but this breaks down in cases where the same element name is used in two different
        // wrappers, a case being Storage BlockList which uses two block elements for its committed and uncommitted
        // block lists.
        IType propertyClientType = property.getWireType().getClientType();

        String listElementName = property.getXmlListElementName();
        String jacksonAnnotation = CoreUtils.isNullOrEmpty(property.getXmlNamespace())
            ? "JacksonXmlProperty(localName = \"" + listElementName + "\")"
            : "JacksonXmlProperty(localName = \"" + listElementName + "\", namespace = \"" + property.getXmlNamespace() + "\")";

        classBlock.annotation(jacksonAnnotation);
        classBlock.privateFinalMemberVariable(propertyClientType.toString(), "items");

        classBlock.annotation("JsonCreator");
        classBlock.privateConstructor(
            wrapperClassName + "(@" + jacksonAnnotation + " " + propertyClientType + " items)",
            constructor -> constructor.line("this.items = items;"));
    }

    /**
     * Adds the annotations for a model field.
     *
     * @param model The model.
     * @param property The property that represents the field.
     * @param classBlock The Java class.
     * @param settings Autorest generation settings.
     */
    protected void addFieldAnnotations(ClientModel model, ClientModelProperty property, JavaClass classBlock, JavaSettings settings) {
        if (settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.FIELD && property.getNeedsFlatten()) {
            classBlock.annotation("JsonFlatten");
        }

        // If the property is a polymorphic discriminator for the class add the annotation @JsonTypeId.
        // This will indicate to Jackson that the discriminator serialization is determined by the property
        // instead of the class level @JsonTypeName annotation. This prevents the discriminator property from
        // being serialized twice, once for the class level annotation and again for the property annotation.
        if (property.isPolymorphicDiscriminator()) {
            classBlock.annotation("JsonTypeId");
        }

        if (settings.isDataPlaneClient()
                && !property.isAdditionalProperties()
                && property.getClientType() instanceof MapType
                && ((MapType) (property.getClientType())).isValueNullable()) {
            classBlock.annotation("JsonInclude(value = JsonInclude.Include.NON_NULL, content = JsonInclude.Include.ALWAYS)");
        }

        boolean treatAsXml = model.isUsedInXml();
        if (modelRequireSerialization(model)) {
            if (!CoreUtils.isNullOrEmpty(property.getHeaderCollectionPrefix())) {
                classBlock.annotation("HeaderCollection(\"" + property.getHeaderCollectionPrefix() + "\")");
            } else if (treatAsXml && property.isXmlAttribute()) {
                classBlock.annotation("JacksonXmlProperty(localName = \"" + property.getXmlName() + "\", isAttribute = true)");
            } else if (treatAsXml && property.getXmlNamespace() != null && !property.getXmlNamespace().isEmpty()) {
                classBlock.annotation("JacksonXmlProperty(localName = \"" + property.getXmlName() + "\", namespace = \"" + property.getXmlNamespace() + "\")");
            } else if (treatAsXml && property.isXmlText()) {
                classBlock.annotation("JacksonXmlText");
            } else if (property.isAdditionalProperties()) {
                classBlock.annotation("JsonIgnore");
            } else if (treatAsXml && property.getWireType() instanceof ListType && !property.isXmlWrapper()) {
                classBlock.annotation("JsonProperty(\"" + property.getXmlListElementName() + "\")");
            } else if (!CoreUtils.isNullOrEmpty(property.getAnnotationArguments())) {
                classBlock.annotation("JsonProperty(" + property.getAnnotationArguments() + ")");
            }
        }
    }

    /**
     * Adds the model constructor to the Java class file.
     *
     * @param model The model.
     * @param constructorVisibility The visibility of constructor.
     * @param settings AutoRest settings.
     * @param classBlock The Java class file.
     */
    private void addModelConstructor(ClientModel model, JavaVisibility constructorVisibility, JavaSettings settings,
        JavaClass classBlock) {
        final boolean requireSerialization = modelRequireSerialization(model);

        // Early out on custom strongly typed headers constructor as this has different handling that doesn't require
        // inspecting the required and constant properties.
        if (model.isStronglyTypedHeader()) {
            ModelTemplateHeaderHelper.addCustomStronglyTypedHeadersConstructor(classBlock, model, settings);
            return;
        }

        // Get the required properties from the super class structure.
        List<ClientModelProperty> requiredParentProperties = ClientModelUtil.getParentConstructorProperties(model, settings);

        // Required properties are those that are required but not constant.
        List<ClientModelProperty> requiredProperties = new ArrayList<>();

        for (ClientModelProperty property : model.getProperties()) {
            // Property isn't required and won't be bucketed into either constant or required properties.
            if (!property.isConstant() && !ClientModelUtil.includePropertyInConstructor(property, settings)) {
                continue;
            }

            // Property matches a parent property, don't need to include it twice.
            if (requiredParentProperties.stream().anyMatch(p -> p.getName().equals(property.getName()))) {
                continue;
            }

            // Only include non-constant properties.
            if (!property.isConstant()) {
                requiredProperties.add(property);
            }
        }

        // Jackson requires a constructor with @JsonCreator, with parameters in wire type. Ref https://github.com/Azure/autorest.java/issues/2170
        boolean generatePrivateConstructorForJackson = false;

        // Description for the class is always the same, not matter whether there are required properties.
        // If there are required properties, the required properties will extend the consumer to add param Javadocs.
        Consumer<JavaJavadocComment> javadocCommentConsumer = comment ->
            comment.description("Creates an instance of " + model.getName() + " class.");

        final int constructorPropertiesStringBuilderCapacity = 128 * (requiredProperties.size() + requiredParentProperties.size());

        // Use a StringBuilder with an initial capacity of 128 times the total number of required constructor properties.
        // If there are no required constructor properties this will simply be zero and result in a no-args constructor
        // being generated.
        StringBuilder constructorProperties =
            new StringBuilder(constructorPropertiesStringBuilderCapacity);

        StringBuilder superProperties = new StringBuilder(64 * requiredParentProperties.size());

        if (settings.isRequiredFieldsAsConstructorArgs()) {
            final boolean constructorParametersContainsMismatchWireType =
                requiredProperties.stream().anyMatch(p -> ClientModelUtil.isWireTypeMismatch(p, true))
                    || requiredParentProperties.stream().anyMatch(p -> ClientModelUtil.isWireTypeMismatch(p, true));

            if (constructorParametersContainsMismatchWireType && !settings.isStreamStyleSerialization()) {
                generatePrivateConstructorForJackson = requireSerialization;
            }

            final boolean addJsonPropertyAnnotation = !(settings.isStreamStyleSerialization() || generatePrivateConstructorForJackson || !requireSerialization);

            // Properties required by the super class structure come first.
            for (ClientModelProperty property : requiredParentProperties) {
                if (constructorProperties.length() > 0) {
                    constructorProperties.append(", ");
                }

                addModelConstructorParameter(property, constructorProperties, addJsonPropertyAnnotation);

                javadocCommentConsumer = javadocCommentConsumer.andThen(comment -> comment.param(property.getName(),
                    "the " + property.getName() + " value to set"));

                if (superProperties.length() > 0) {
                    superProperties.append(", ");
                }

                superProperties.append(property.getName());
            }

            // Then properties required by this class come next.
            for (ClientModelProperty property : requiredProperties) {
                if (constructorProperties.length() > 0) {
                    constructorProperties.append(", ");
                }

                addModelConstructorParameter(property, constructorProperties, addJsonPropertyAnnotation);

                javadocCommentConsumer = javadocCommentConsumer.andThen(comment -> comment.param(property.getName(),
                    "the " + property.getName() + " value to set"));
            }
        }

        // Add the Javadocs for the constructor.
        classBlock.javadocComment(javadocCommentConsumer);

        addGeneratedAnnotation(classBlock);
        // If there are any constructor arguments indicate that this is the JsonCreator. No args constructors are
        // implicitly used as the JsonCreator if the class doesn't indicate one.
        if (requireSerialization
            && constructorProperties.length() > 0 && !settings.isStreamStyleSerialization()
            // @JsonCreator will be on the other private constructor
            && !generatePrivateConstructorForJackson) {
            classBlock.annotation("JsonCreator");
        }

        // If immutableOutputModel, make the constructor private, so that adding required properties, or changing model to input-output will not have breaking changes.
        // For user in test, they will need to mock the class.

        // If constructorProperties empty this just becomes an empty constructor.
        classBlock.constructor(constructorVisibility, model.getName() + "(" + constructorProperties + ")", constructor -> {
            // If there are super class properties, call super() first.
            if (superProperties.length() > 0) {
                constructor.line("super(" + superProperties + ");");
            }

            // If we're always adding the polymorphic discriminator to updated properties, may as well just make the
            // serialization always add them. This will remove the need to track them, further reducing Set updating and
            // querying, which can improve performance in high throughput scenarios.
            // If there is a polymorphic discriminator , add a line to initialize the discriminator.
//            ClientModelProperty polymorphicProperty = model.getPolymorphicDiscriminator();
//            if (polymorphicProperty != null && !polymorphicProperty.isRequired()) {
//                if (ClientModelUtil.isJsonMergePatchModel(model, settings)) {
//                    for (ClientModelProperty property : model.getParentPolymorphicDiscriminators()) {
//                        constructor.line("this.updatedProperties.add(\"" + property.getName() + "\");");
//                    }
//
//                    constructor.line("this.updatedProperties.add(\"" + polymorphicProperty.getName() + "\");");
//                }
//            }

            // constant properties should already be initialized in class variable definition
//            // Then, add all constant properties.
//            for (ClientModelProperty property : constantProperties) {
//                constructor.line(property.getName() + " = " + property.getDefaultValue() + ";");
//            }

            // Finally, add all required properties.
            if (settings.isRequiredFieldsAsConstructorArgs()) {
                for (ClientModelProperty property : requiredProperties) {
                    if (property.getClientType() != property.getWireType()) {
                        // If the property needs to be converted and the passed value is null, set the field to null as the
                        // converter will likely throw a NullPointerException.
                        // Otherwise, just convert the value.
                        constructor.ifBlock(property.getName() + " == null",
                                ifBlock -> ifBlock.line("this.%s = %s;", property.getName(), property.getWireType().defaultValueExpression()))
                            .elseBlock(elseBlock -> elseBlock.line("this.%s = %s;",
                                property.getName(), property.getWireType().convertFromClientType(property.getName())));
                    } else {
                        constructor.line("this." + property.getName() + " = " + property.getWireType().convertFromClientType(property.getName()) + ";");
                    }
                }
            }
        });

        if (generatePrivateConstructorForJackson) {
            addGeneratedAnnotation(classBlock);
            classBlock.annotation("JsonCreator");

            StringBuilder constructorPropertiesAsWireType =
                    new StringBuilder(constructorPropertiesStringBuilderCapacity);

            StringBuilder constructorPropertiesInvokePublicConstructor =
                    new StringBuilder(constructorPropertiesStringBuilderCapacity);

            final Consumer<ClientModelProperty> addParameterInvokePublicConstructor = p -> {
                if (constructorPropertiesInvokePublicConstructor.length() > 0) {
                    constructorPropertiesInvokePublicConstructor.append(", ");
                }

                if (p.getWireType() == p.getClientType()) {
                    constructorPropertiesInvokePublicConstructor.append(p.getName());
                } else {
                    constructorPropertiesInvokePublicConstructor.append(p.getWireType().convertToClientType(p.getName()));
                }
            };

            for (ClientModelProperty property : requiredParentProperties) {
                if (constructorPropertiesAsWireType.length() > 0) {
                    constructorPropertiesAsWireType.append(", ");
                }

                addModelConstructorParameterAsWireType(property, constructorPropertiesAsWireType);

                addParameterInvokePublicConstructor.accept(property);
            }
            for (ClientModelProperty property : requiredProperties) {
                if (constructorPropertiesAsWireType.length() > 0) {
                    constructorPropertiesAsWireType.append(", ");
                }

                addModelConstructorParameterAsWireType(property, constructorPropertiesAsWireType);

                addParameterInvokePublicConstructor.accept(property);
            }

            classBlock.privateConstructor(model.getName() + "(" + constructorPropertiesAsWireType + ")", constructor -> {
                constructor.line("this(" + constructorPropertiesInvokePublicConstructor + ");");
            });
        }
    }

    /**
     * Adds a constructor parameter to the constructor signature builder.
     * <p>
     * The parameter takes client type of property in constructor.
     *
     * @param property The client model property as constructor parameter.
     * @param constructorSignatureBuilder The constructor signature builder.
     * @param addJsonPropertyAnnotation whether to add {@code @JsonProperty} annotation on parameter.
     */
    private static void addModelConstructorParameter(ClientModelProperty property,
        StringBuilder constructorSignatureBuilder, boolean addJsonPropertyAnnotation) {

        if (addJsonPropertyAnnotation) {
            constructorSignatureBuilder.append("@JsonProperty(").append(property.getAnnotationArguments()).append(") ");
        }
        constructorSignatureBuilder.append(property.getClientType()).append(" ").append(property.getName());
    }

    /**
     * Adds a constructor parameter to the constructor signature builder.
     * <p>
     * The parameter takes wire type of property in constructor.
     *
     * @param property The client model property as constructor parameter.
     * @param constructorSignatureBuilder The constructor signature builder.
     */
    private static void addModelConstructorParameterAsWireType(
        ClientModelProperty property,
        StringBuilder constructorSignatureBuilder) {

        constructorSignatureBuilder
            .append("@JsonProperty(").append(property.getAnnotationArguments()).append(") ")
            .append(property.getWireType()).append(" ").append(property.getName());
    }

    /**
     * Adds a getter method.
     *
     * @param propertyWireType The property wire type.
     * @param propertyClientType The client property type.
     * @param property The property.
     * @param treatAsXml Whether the getter should treat the property as XML.
     * @param methodBlock Where the getter method is being added.
     * @param settings Java settings.
     */
    private static void addGetterMethod(IType propertyWireType, IType propertyClientType, ClientModelProperty property,
        boolean treatAsXml, JavaBlock methodBlock, JavaSettings settings) {
        String sourceTypeName = propertyWireType.toString();
        String targetTypeName = propertyClientType.toString();
        String expression = "this." + property.getName();
        if (propertyWireType.equals(ArrayType.BYTE_ARRAY)) {
            expression = TemplateHelper.getByteCloneExpression(expression);
        }

        if (sourceTypeName.equals(targetTypeName)) {
            if (treatAsXml && property.isXmlWrapper() && (property.getWireType() instanceof IterableType)) {
                String thisGetName = "this." + property.getName();
                if (settings.isStreamStyleSerialization()) {
                    methodBlock.ifBlock(thisGetName + " == null", ifBlock ->
                        ifBlock.line(thisGetName + " = new ArrayList<>();"));
                    methodBlock.methodReturn("this." + property.getName());
                } else {
                    methodBlock.ifBlock(thisGetName + " == null", ifBlock ->
                        ifBlock.line("this.%s = new %s(new ArrayList<%s>());", property.getName(),
                            getPropertyXmlWrapperClassName(property),
                            ((GenericType) property.getWireType()).getTypeArguments()[0]));
                    methodBlock.methodReturn(thisGetName + ".items");
                }
            } else {
                methodBlock.methodReturn(expression);
            }
        } else {
            // If the wire type was null, return null as the returned conversion could, and most likely would, result
            // in a NullPointerException.
            if (propertyWireType.isNullable()) {
                methodBlock.ifBlock(expression + " == null",
                    ifBlock -> ifBlock.methodReturn(propertyClientType.defaultValueExpression()));
            }

            // Return the conversion of the wire type to the client type. An example would be a wire type of
            // DateTimeRfc1123 and a client type of OffsetDateTime (type a consumer would use), this makes the return
            // "this.value.getDateTime()".
            methodBlock.methodReturn(propertyWireType.convertToClientType(expression));
        }
    }

    /**
     * Adds a setter method.
     *
     * @param propertyWireType      The property wire type.
     * @param propertyClientType    The client property type.
     * @param property              The property.
     * @param treatAsXml            Whether the setter should treat the property as XML.
     * @param methodBlock           Where the setter method is being added.
     * @param isJsonMergePatchModel Whether the client model is a JSON merge patch model.
     */
    private static void addSetterMethod(IType propertyWireType, IType propertyClientType, ClientModelProperty property,
        boolean treatAsXml, JavaBlock methodBlock, JavaSettings settings, boolean isJsonMergePatchModel) {
        String expression = (propertyClientType.equals(ArrayType.BYTE_ARRAY))
            ? TemplateHelper.getByteCloneExpression(property.getName())
            : property.getName();

        if (propertyClientType != propertyWireType) {
            // If the property needs to be converted and the passed value is null, set the field to null as the
            // converter will likely throw a NullPointerException.
            // Otherwise, just convert the value.
            methodBlock.ifBlock(property.getName() + " == null",
                    ifBlock -> ifBlock.line("this.%s = %s;", property.getName(), property.getWireType().defaultValueExpression()))
                .elseBlock(elseBlock ->
                    elseBlock.line("this.%s = %s;", property.getName(), propertyWireType.convertFromClientType(expression)));
        } else {
            if (treatAsXml && property.isXmlWrapper()) {
                if (settings.isStreamStyleSerialization()) {
                    methodBlock.line("this." + property.getName() + " = " + expression + ";");
                } else {
                    methodBlock.line("this.%s = new %s(%s);", property.getName(),
                        getPropertyXmlWrapperClassName(property), expression);
                }
            } else {
                methodBlock.line("this.%s = %s;", property.getName(), expression);
            }
        }

        if (isJsonMergePatchModel) {
            methodBlock.line("this.updatedProperties.add(\"" + property.getName() + "\");");
        }

        methodBlock.methodReturn("this");
    }

    private void addPropertyValidations(JavaClass classBlock, ClientModel model, JavaSettings settings) {
        if (settings.isClientSideValidations()) {

            // javadoc
            classBlock.javadocComment((comment) -> {
                comment.description("Validates the instance.");

                comment.methodThrows("IllegalArgumentException", "thrown if the instance is not valid");
            });

            if (this.parentModelHasValidate(model.getParentModelName())) {
                classBlock.annotation("Override");
            }
            classBlock.publicMethod("void validate()", methodBlock -> {
                if (this.callParentValidate(model.getParentModelName())) {
                    methodBlock.line("super.validate();");
                }
                for (ClientModelProperty property : getValidationProperties(model)) {
                    String validation = property.getClientType().validate(getGetterName(model, property) + "()");
                    if (property.isRequired() && !property.isReadOnly() && !property.isConstant() && !(property.getClientType() instanceof PrimitiveType)) {
                        JavaIfBlock nullCheck = methodBlock.ifBlock(String.format("%s() == null", getGetterName(model, property)), ifBlock -> {
                            final String errorMessage = String.format("\"Missing required property %s in model %s\"", property.getName(), model.getName());
                            if (settings.isUseClientLogger()) {
                                ifBlock.line(
                                    "throw LOGGER.atError().log(new IllegalArgumentException(" + errorMessage + "));");
                            } else {
                                ifBlock.line("throw new IllegalArgumentException(" + errorMessage + ");");
                            }
                        });
                        if (validation != null) {
                            nullCheck.elseBlock(elseBlock -> elseBlock.line(validation + ";"));
                        }
                    } else if (validation != null) {
                        methodBlock.ifBlock(getGetterName(model, property) + "() != null",
                            ifBlock -> ifBlock.line(validation + ";"));
                    }
                }
            });
        }
    }

    /**
     * Extension for validation on parent model.
     *
     * @param parentModelName parent model name
     * @return whether to call validate() on parent model
     */
    protected boolean callParentValidate(String parentModelName) {
        return parentModelHasValidate(parentModelName);
    }

    /**
     * Gets properties to validate in `validate()` method.
     *
     * @param model the model to add `validate()` method
     * @return properties to validate in `validate()` method
     */
    protected List<ClientModelProperty> getValidationProperties(ClientModel model) {
        return model.getProperties();
    }

    /**
     * Gets the property XML wrapper class name.
     *
     * @param property The property that is getting its XML wrapper class name.
     * @return The property XML wrapper class name.
     */
    static String getPropertyXmlWrapperClassName(ClientModelProperty property) {
        return property.getXmlName() + "Wrapper";
    }

    /**
     * Extension for validation on parent model.
     *
     * @param parentModelName the parent model name
     * @return Whether validate() exists in parent model.
     */
    protected boolean parentModelHasValidate(String parentModelName) {
        return parentModelName != null;
    }

    /**
     * Extension for property getter method name.
     *
     * @param model the model
     * @param property the property
     * @return The property getter method name.
     */
    protected String getGetterName(ClientModel model, ClientModelProperty property) {
        return property.getGetterName();
    }

    /**
     * Extension for Fluent list of client model property reference.
     *
     * @param model the client model.
     * @return the list of client model property reference.
     */
    protected List<ClientModelPropertyReference> getClientModelPropertyReferences(ClientModel model) {
        List<ClientModelPropertyReference> propertyReferences = new ArrayList<>();
        String lastParentName = model.getName();
        String parentModelName = model.getParentModelName();
        while (parentModelName != null && !lastParentName.equals(parentModelName)) {
            ClientModel parentModel = ClientModelUtil.getClientModel(parentModelName);
            if (parentModel != null) {
                if (parentModel.getProperties() != null) {
                    parentModel.getProperties().stream()
                        .filter(p -> !p.getClientFlatten() && !p.isAdditionalProperties())
                        .map(ClientModelPropertyReference::ofParentProperty)
                        .forEach(propertyReferences::add);
                }

                if (parentModel.getPropertyReferences() != null) {
                    parentModel.getPropertyReferences().stream()
                        .filter(ClientModelPropertyReference::isFromFlattenedProperty)
                        .map(ClientModelPropertyReference::ofParentProperty)
                        .forEach(propertyReferences::add);
                }
            }

            lastParentName = parentModelName;
            parentModelName = parentModel == null ? null : parentModel.getParentModelName();
        }
        return propertyReferences;
    }

    /**
     * Checks whether to generate constant "private final static byte[] EMPTY_BYTE_ARRAY = new byte[0];"
     *
     * @param model the model
     * @param settings Java settings
     * @return Whether to generate the constant.
     */
    private static boolean isGenerateConstantEmptyByteArray(ClientModel model, JavaSettings settings) {
        if (!settings.isNullByteArrayMapsToEmptyArray()) {
            return false;
        }

        boolean ret = model.getProperties().stream()
            .anyMatch(property -> property.getClientType() == ArrayType.BYTE_ARRAY
                && property.getWireType() != property.getClientType());

        if (!ret && !CoreUtils.isNullOrEmpty(model.getParentModelName())) {
            ret = ClientModelUtil.getParentProperties(model).stream()
                .anyMatch(property -> property.getClientType() == ArrayType.BYTE_ARRAY
                    && property.getWireType() != property.getClientType());
        }

        // flatten properties
        if (!ret && settings.getClientFlattenAnnotationTarget() == JavaSettings.ClientFlattenAnnotationTarget.NONE) {
            // "return this.innerProperties() == null ? EMPTY_BYTE_ARRAY : this.innerProperties().property1();"
            ret = model.getPropertyReferences().stream()
                .filter(ClientModelPropertyReference::isFromFlattenedProperty)
                .anyMatch(p -> p.getClientType() == ArrayType.BYTE_ARRAY);
        }

        return ret;
    }

    /**
     * Checks whether the serialization code is required for the model.
     *
     * @param model the model.
     * @return whether the serialization code is required for the model.
     */
    private static boolean modelRequireSerialization(ClientModel model) {
        // TODO (weidxu): any other case? "binary"?
        return !ClientModelUtil.isMultipartModel(model)
                // not GroupSchema
                && !(model.getImplementationDetails() != null && model.getImplementationDetails().getUsages() != null && model.getImplementationDetails().getUsages().contains(ImplementationDetails.Usage.OPTIONS_GROUP));
    }

    /**
     * Writes stream-style serialization logic for serializing to and deserializing from the serialization format that
     * the model uses.
     *
     * @param classBlock The class block where serialization methods will be written.
     * @param model The model.
     * @param settings Autorest generation settings.
     */
    protected void writeStreamStyleSerialization(JavaClass classBlock, ClientModel model, JavaSettings settings) {
        // No-op, meant for StreamSerializationModelTemplate.
    }

    protected void addGeneratedImport(Set<String> imports) {
        if (JavaSettings.getInstance().isDataPlaneClient()) {
            if (JavaSettings.getInstance().isBranded()) {
                Annotation.GENERATED.addImportsTo(imports);
            } else {
                Annotation.METADATA.addImportsTo(imports);
            }
        }
    }

    protected void addGeneratedAnnotation(JavaContext classBlock) {
        if (JavaSettings.getInstance().isDataPlaneClient()) {
            if (JavaSettings.getInstance().isBranded()) {
                classBlock.annotation(Annotation.GENERATED.getName());
            } else {
                classBlock.annotation(Annotation.METADATA.getName() + "(generated = true)");
            }
        }
    }

    // Javadoc for getter method
    private static void generateGetterJavadoc(JavaClass classBlock, ClientModelPropertyAccess property) {
        classBlock.javadocComment(comment -> {
            comment.description("Get the " + property.getName() + " property: " + property.getDescription());
            comment.methodReturns("the " + property.getName() + " value");
        });
    }

    // Javadoc for setter method
    private static void generateSetterJavadoc(JavaClass classBlock, ClientModel model,
        ClientModelPropertyAccess property) {
        classBlock.javadocComment((comment) -> {
            if (property.getDescription() == null || property.getDescription().contains(MISSING_SCHEMA)) {
                comment.description("Set the " + property.getName() + " property");
            } else {
                comment.description("Set the " + property.getName() + " property: " + property.getDescription());
            }
            if (property.isRequiredForCreate() && !property.isRequired()) {
                comment.line("<p>Required when create the resource.</p>");
            }
            comment.param(property.getName(), "the " + property.getName() + " value to set");
            comment.methodReturns("the " + model.getName() + " object itself.");
        });
    }

    private static final class StreamStyleImports extends HashSet<String> {
        @Override
        public boolean add(String s) {
            if (s != null && s.contains("fasterxml")) {
                return true;
            }

            return super.add(s);
        }
    }

    /**
     * Add json-merge-patch related flag and accessors.
     */
    private void addJsonMergePatchRelatedPropertyAndAccessors(JavaClass classBlock, ClientModel model) {
        if (!model.getImplementationDetails().isInput()) {
            // Model doesn't get used in serialization, no need to add json merge patch related properties and
            // accessors.
            return;
        }

        classBlock.javadocComment(comment ->
            comment.description("Stores updated model property, the value is property name, not serialized name"));
        addGeneratedAnnotation(classBlock);
        classBlock.privateFinalMemberVariable("Set<String> updatedProperties = new HashSet<>()");

        if (model.isPolymorphic() && CoreUtils.isNullOrEmpty(model.getDerivedModels())) {
            // Only polymorphic parent models generate an accessor.
            // If it is the super most parent model, it will generate the prepareModelForJsonMergePatch method.
            // Other parents need to generate setters for the properties that are used in json-merge-patch, used in
            // deserialization to prevent these properties from always being included in serialization.
            return;
        }

        List<ClientModelProperty> setterProperties = !model.isPolymorphic() ? Collections.emptyList()
            : model.getProperties().stream()
                .filter(property -> !property.isConstant() && !property.isPolymorphicDiscriminator())
                .collect(Collectors.toList());

        boolean rootParent = CoreUtils.isNullOrEmpty(model.getParentModelName());
        if (!rootParent && setterProperties.isEmpty()) {
            // Model isn't the root parent and doesn't have any setter properties, no need to generate an accessor.
            return;
        }

        if (rootParent) {
            // Only the root model needs to have the jsonMergePatch property.
            addGeneratedAnnotation(classBlock);
            classBlock.privateMemberVariable("boolean jsonMergePatch");
        }

        if (rootParent) {
            // setter
            addGeneratedAnnotation(classBlock);
            classBlock.privateMethod("void serializeAsJsonMergePatch(boolean jsonMergePatch)",
                method -> method.line("this.jsonMergePatch = jsonMergePatch;"));
        }

        // static code block to access jsonMergePatch setter
        classBlock.staticBlock(staticBlock -> {
            String accessorName = model.getName() + "Accessor";
            staticBlock.line("JsonMergePatchHelper.set" + accessorName + "(new JsonMergePatchHelper." + accessorName + "() {");
            staticBlock.indent(() -> {
                if (rootParent) {
                    staticBlock.line("@Override");
                    staticBlock.block("public " + model.getName() + " prepareModelForJsonMergePatch(" + model.getName()
                        + " model, boolean jsonMergePatchEnabled)", setJsonMergePatch -> {
                        staticBlock.line("model.serializeAsJsonMergePatch(jsonMergePatchEnabled);");
                        staticBlock.line("return model;");
                    });

                    staticBlock.line("@Override");
                    staticBlock.block("public boolean isJsonMergePatch(" + model.getName() + " model)",
                        getJsonMergePatch -> getJsonMergePatch.line("return model.jsonMergePatch;"));
                }

                for (ClientModelProperty setter : setterProperties) {
                    staticBlock.line("@Override");
                    staticBlock.block("public void " + setter.getSetterName() + "(" + model.getName()
                        + " model, " + setter.getWireType() + " " + setter.getName() + ")",
                        setField -> setField.line("model." + setter.getName() + " = " + setter.getName() + ";"));
                }
            });

            staticBlock.line("});");
        });
    }

    static boolean modelDefinesProperty(ClientModel model, ClientModelProperty property) {
        return ClientModelUtil.getParentProperties(model).stream().noneMatch(parentProperty ->
            Objects.equals(property.getSerializedName(), parentProperty.getSerializedName()));
    }

    static ClientModel getDefiningModel(ClientModel model, ClientModelProperty property) {
        ClientModel current = model;
        while(current != null) {
            if (modelDefinesProperty(current, property)) {
                return current;
            }
            current = ClientModelUtil.getClientModel(current.getParentModelName());
        }
        throw new IllegalArgumentException("unable to find defining model for property: " + property);
    }
}
