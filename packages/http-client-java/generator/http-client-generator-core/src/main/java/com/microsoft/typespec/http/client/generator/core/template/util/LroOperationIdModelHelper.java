// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.util;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningOperationIdMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.slf4j.Logger;

/**
 * Generates LRO operation ID state and accessors on status-monitor models.
 */
public final class LroOperationIdModelHelper {
    private static final Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), LroOperationIdModelHelper.class);
    private static final String FIELD_NAME = "lroOperationId";
    private static final String GETTER_NAME = "getOperationId";
    private static final String PROPERTY_VALUE_NAME = "propertyValue";

    private final ClientModel model;
    private final LongRunningOperationIdMetadata metadata;
    private final ClientModelProperty operationIdProperty;
    private final Consumer<JavaContext> addGeneratedAnnotation;

    /**
     * Creates a helper for the model's operation ID, if supported.
     *
     * @param model the status-monitor model.
     * @param addGeneratedAnnotation writes the generated-code annotation.
     */
    public LroOperationIdModelHelper(ClientModel model, Consumer<JavaContext> addGeneratedAnnotation) {
        this.model = model;
        this.metadata = resolveMetadata(model);
        this.operationIdProperty = metadata == null ? null : resolveProperty(model, metadata);
        this.addGeneratedAnnotation = addGeneratedAnnotation;
    }

    /**
     * Adds imports needed to populate an operation ID from the polling URL.
     *
     * @param imports the model imports.
     * @param settings the generator settings.
     */
    public void addImports(Set<String> imports, JavaSettings settings) {
        if (hasPathSource()) {
            imports.add(settings.getPackage(settings.getImplementationSubpackage()) + "."
                + ClientModelUtil.OPERATION_ID_POLLING_STRATEGY);
        }
    }

    /**
     * Adds the non-wire field and registers its internal setter.
     *
     * @param classBlock the model class.
     */
    public void addField(JavaClass classBlock) {
        if (!hasPathSource()) {
            return;
        }
        classBlock.javadocComment(comment -> comment
            .description("The operation ID from the polling URL, set by the polling strategy after deserialization."));
        addGeneratedAnnotation.accept(classBlock);
        classBlock.privateMemberVariable("String " + FIELD_NAME);
        classBlock.staticBlock(
            staticBlock -> staticBlock.line(ClientModelUtil.OPERATION_ID_POLLING_STRATEGY + ".setOperationIdAccessor("
                + model.getName() + ".class, (model, operationId) -> model." + FIELD_NAME + " = operationId);"));
    }

    /**
     * Writes documentation when an existing property getter needs the polling URL fallback.
     *
     * @param classBlock the model class.
     * @param property the property being generated.
     * @return whether the getter documentation was written.
     */
    public boolean writeGetterJavadoc(JavaClass classBlock, ClientModelProperty property) {
        if (!usesPathFallback(property)) {
            return false;
        }
        classBlock.javadocComment(comment -> {
            comment.description("Get the operation ID from the status response, or from the polling URL "
                + "if the property is absent.");
            comment
                .methodReturns("the operation ID, or null until a status response with a body has " + "been received.");
        });
        return true;
    }

    /**
     * Writes the polling URL fallback for an existing operation ID getter.
     *
     * @param methodBlock the getter body.
     * @param property the property being generated.
     * @return whether the getter body was written.
     */
    public boolean writeGetterBody(JavaBlock methodBlock, ClientModelProperty property) {
        if (!usesPathFallback(property)) {
            return false;
        }
        methodBlock.methodReturn(
            "this." + property.getName() + " != null ? this." + property.getName() + " : this." + FIELD_NAME);
        return true;
    }

    /**
     * Adds the operation ID accessor unless an existing property getter provides it.
     *
     * @param classBlock the model class.
     */
    public void addAccessors(JavaClass classBlock) {
        if (JavaSettings.getInstance().isStreamStyleSerialization()) {
            for (ClientModelProperty property : model.getProperties()) {
                String wireGetter = getSerializationGetterName(model, property);
                if (!wireGetter.equals(property.getGetterName())) {
                    addGeneratedAnnotation.accept(classBlock);
                    classBlock.method(JavaVisibility.Protected, List.of(JavaModifier.Final),
                        "String " + wireGetter + "()",
                        methodBlock -> methodBlock.methodReturn("this." + property.getName()));
                }
            }
        }
        if (metadata == null) {
            if (model.getLroOperationId() != null) {
                LOGGER.warn("Cannot expose the long-running operation ID on model '{}': a property conflicts with "
                    + "the generated accessor or field.", model.getName());
            }
            return;
        }
        final ClientModelProperty property = operationIdProperty;
        final boolean hasPathSource = hasPathSource();
        if (metadata.getPropertySerializedName() != null && property == null) {
            LOGGER.warn(
                "Cannot expose the selected long-running operation ID property '{}' on model '{}': "
                    + "the property is missing or is not a String.",
                metadata.getPropertySerializedName(), model.getName());
        }
        if (property == null && !hasPathSource) {
            return;
        }

        boolean usesExistingGetter = property != null && GETTER_NAME.equals(property.getGetterName());
        if (usesExistingGetter && (!hasPathSource || model.getProperties().contains(property))) {
            return;
        }

        final String description;
        if (property != null && hasPathSource) {
            description = "Get the ID of the long-running operation, from the {@code " + property.getSerializedName()
                + "} property, or from the polling URL if the property is absent.";
        } else if (property != null) {
            description = "Get the ID of the long-running operation, from the {@code " + property.getSerializedName()
                + "} property.";
        } else {
            description = "Get the ID of the long-running operation, from the polling URL.";
        }
        classBlock.javadocComment(comment -> {
            comment.description(description);
            comment.methodReturns("the ID of the long-running operation, or null if unavailable. The poll result is "
                + "available when a status response with a body has been received.");
        });
        addGeneratedAnnotation.accept(classBlock);
        classBlock.publicMethod("String " + GETTER_NAME + "()", methodBlock -> {
            if (property != null && hasPathSource) {
                methodBlock.line("String " + PROPERTY_VALUE_NAME + " = " + (usesExistingGetter ? "super." : "this.")
                    + property.getGetterName() + "();");
                methodBlock
                    .methodReturn(PROPERTY_VALUE_NAME + " != null ? " + PROPERTY_VALUE_NAME + " : this." + FIELD_NAME);
            } else if (property != null) {
                methodBlock.methodReturn("this." + property.getGetterName() + "()");
            } else {
                methodBlock.methodReturn("this." + FIELD_NAME);
            }
        });
    }

    private boolean hasPathSource() {
        return metadata != null && metadata.hasPathSource();
    }

    /**
     * Gets a getter that preserves the body property when serialization reads an inherited operation ID.
     *
     * @param model the model being serialized.
     * @param property the inherited property.
     * @return the raw property getter, or the normal getter if no polling URL fallback can apply.
     */
    public static String getSerializationGetterName(ClientModel model, ClientModelProperty property) {
        if (!GETTER_NAME.equals(property.getGetterName()) || !ClassType.STRING.equals(property.getWireType())) {
            return property.getGetterName();
        }
        List<ClientModel> models = Stream.concat(Stream.of(model), ClientModels.getInstance().getModels().stream())
            .collect(java.util.stream.Collectors.toList());
        boolean usesFallback = models.stream().anyMatch(candidate -> {
            LongRunningOperationIdMetadata metadata = resolveMetadata(candidate);
            return metadata != null && metadata.hasPathSource() && resolveProperty(candidate, metadata) == property;
        });
        if (!usesFallback) {
            return property.getGetterName();
        }
        Set<String> getters = models.stream()
            .flatMap(candidate -> candidate.getProperties().stream())
            .map(ClientModelProperty::getGetterName)
            .collect(java.util.stream.Collectors.toSet());
        String name = "getLroOperationIdPropertyValue";
        for (int suffix = 1; getters.contains(name); suffix++) {
            name = "getLroOperationIdPropertyValue" + suffix;
        }
        return name;
    }

    private boolean usesPathFallback(ClientModelProperty property) {
        return hasPathSource()
            && property == operationIdProperty
            && GETTER_NAME.equals(property.getGetterName())
            && ClassType.STRING.equals(property.getWireType());
    }

    private static LongRunningOperationIdMetadata resolveMetadata(ClientModel model) {
        final LongRunningOperationIdMetadata metadata = model.getLroOperationId();
        if (metadata == null) {
            return null;
        }
        final boolean conflict
            = properties(model).anyMatch(p -> (metadata.hasPathSource() && FIELD_NAME.equals(p.getName()))
                || (GETTER_NAME.equals(p.getGetterName())
                    && (!Objects.equals(metadata.getPropertySerializedName(), p.getSerializedName())
                        || !ClassType.STRING.equals(p.getClientType())
                        || !ClassType.STRING.equals(p.getWireType()))));
        return conflict ? null : metadata;
    }

    private static ClientModelProperty resolveProperty(ClientModel model, LongRunningOperationIdMetadata metadata) {
        if (metadata.getPropertySerializedName() == null) {
            return null;
        }
        return properties(model).filter(p -> metadata.getPropertySerializedName().equals(p.getSerializedName())
            && ClassType.STRING.equals(p.getClientType())).findFirst().orElse(null);
    }

    private static Stream<ClientModelProperty> properties(ClientModel model) {
        return Stream.concat(model.getProperties().stream(), ClientModelUtil.getParentProperties(model).stream());
    }
}
