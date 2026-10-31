// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SseModelMetadata;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Writes mapped model wrappers for a named server-sent event union.
 */
public final class SseEventModelTemplate {
    private static final SseEventModelTemplate INSTANCE = new SseEventModelTemplate();

    private SseEventModelTemplate() {
    }

    public static SseEventModelTemplate getInstance() {
        return INSTANCE;
    }

    public void write(ClientModel model, JavaFile javaFile) {
        SseModelMetadata metadata = SseUtil.requireSseMetadata(model);
        if (metadata.isBaseModel()) {
            writeBase(model, metadata, javaFile);
        } else {
            writeEvent(model, metadata, javaFile);
        }
    }

    private void writeBase(ClientModel model, SseModelMetadata metadata, JavaFile javaFile) {
        ClientModelProperty eventNameProperty = getProperty(model, "eventName");
        String baseEventName = model.getName();
        String serializerName = metadata.getSerializerType().getName();
        String streamDescription = SseUtil.getStreamDescription(model);
        Set<String> imports = new LinkedHashSet<>();
        for (ClientModel event : model.getDerivedModels()) {
            getProperty(event, "value").getClientType().addImportsTo(imports, false);
        }
        metadata.getSerializerType().addImportsTo(imports, false);
        Annotation.GENERATED.addImportsTo(imports);
        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> {
            comment.description("Base for polymorphic events emitted by a streaming " + streamDescription + ".");
            comment
                .description("Known events expose typed payloads through their subtype's {@code getValue()} method.");
            comment.line("Unrecognized events expose only their names through");
            comment.description("{@link #getEventName()}; their payloads are not available and they are not terminal.");
            comment.description(
                "Stream events are envelopes, not JSON payload models; serialize the typed payload instead.");
            for (ClientModel event : model.getDerivedModels()) {
                comment.see(event.getName());
            }
        });
        javaFile.publicClass(List.of(JavaModifier.Abstract), baseEventName, javaClass -> {
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.privateFinalMemberVariable(eventNameProperty.getClientType() + " " + eventNameProperty.getName());
            javaClass.javadocComment(comment -> {
                comment.description("Creates a stream event.");
                comment.param(eventNameProperty.getName(), "The server-sent event name.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.packagePrivateConstructor(
                baseEventName + "(" + eventNameProperty.getClientType() + " " + eventNameProperty.getName() + ")",
                constructor -> constructor
                    .line("this." + eventNameProperty.getName() + " = " + eventNameProperty.getName() + ";"));
            javaClass.javadocComment(comment -> {
                comment.description("Gets the server-sent event name.");
                comment.methodReturns("The event name.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod(
                "final " + eventNameProperty.getClientType() + " " + eventNameProperty.getGetterName() + "()",
                method -> method.methodReturn(eventNameProperty.getName()));
            javaClass.javadocComment(comment -> {
                comment.description(
                    "Gets whether this event terminates the " + SseUtil.getStreamKindDescription(model) + " stream.");
                comment.methodReturns("{@code true} if this is a terminal event; otherwise {@code false}.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("false"));
            javaClass.staticBlock(staticBlock -> {
                staticBlock.line(
                    serializerName + ".setConstructorAccessor(new " + serializerName + ".ConstructorAccessor() {");
                staticBlock.indent(() -> {
                    staticBlock.line("@Override");
                    staticBlock.block("public " + baseEventName + " unknownEvent(String eventName)",
                        method -> method.methodReturn("new " + baseEventName + "(eventName) {}"));
                    for (ClientModel event : model.getDerivedModels()) {
                        SseModelMetadata eventMetadata = SseUtil.requireSseMetadata(event);
                        ClientModelProperty value = getProperty(event, "value");
                        staticBlock.line("@Override");
                        staticBlock.block(
                            "public " + event.getName() + " "
                                + SseUtil.getEventFactoryMethodName(eventMetadata.getEventName()) + "("
                                + value.getClientType() + " value)",
                            method -> method.methodReturn("new " + event.getName() + "(value)"));
                    }
                });
                staticBlock.line("});");
            });
        });
    }

    private void writeEvent(ClientModel model, SseModelMetadata metadata, JavaFile javaFile) {
        ClientModelProperty value = getProperty(model, "value");
        IType payloadType = value.getClientType();
        Set<String> imports = new LinkedHashSet<>();
        payloadType.addImportsTo(imports, false);
        metadata.getBaseEventType().addImportsTo(imports, false);
        Annotation.GENERATED.addImportsTo(imports);
        Annotation.IMMUTABLE.addImportsTo(imports);
        javaFile.declareImport(imports);

        String streamDescription = SseUtil.getStreamDescription(model);
        javaFile.javadocComment(comment -> {
            comment.description("Represents the {@code " + TemplateUtil.escapeString(metadata.getEventName()) + "} "
                + streamDescription + " stream event.");
            comment.description("Access the typed payload with {@link #getValue()}.");
            comment.see(metadata.getBaseEventType().getName());
        });
        javaFile.annotation(Annotation.IMMUTABLE.getName());
        javaFile.publicFinalClass(model.getName() + " extends " + metadata.getBaseEventType().getName(), javaClass -> {
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.privateFinalMemberVariable(payloadType + " " + value.getName());
            javaClass.javadocComment(comment -> {
                comment.description("Creates an event wrapper.");
                comment.param(value.getName(), "The event payload.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.packagePrivateConstructor(model.getName() + "(" + payloadType + " " + value.getName() + ")",
                constructor -> {
                    constructor.line("super(\"" + TemplateUtil.escapeString(metadata.getEventName()) + "\");");
                    constructor.line("this." + value.getName() + " = " + value.getName() + ";");
                });
            javaClass.javadocComment(comment -> {
                comment.description("Gets the event payload.");
                comment.methodReturns("The event payload.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod(payloadType + " " + value.getGetterName() + "()",
                method -> method.methodReturn(value.getName()));
            if (metadata.isTerminal()) {
                javaClass.annotation(Annotation.GENERATED.getName());
                javaClass.annotation("Override");
                javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("true"));
            }
        });
    }

    private static ClientModelProperty getProperty(ClientModel model, String serializedName) {
        return model.getProperties()
            .stream()
            .filter(property -> serializedName.equals(property.getSerializedName()))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException(
                "SSE model '" + model.getFullName() + "' has no '" + serializedName + "' property."));
    }
}
