// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.util.SseNamingResolver;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Writes the generated model wrappers for a named server-sent event union.
 */
public final class SseEventModelTemplate {
    private static final SseEventModelTemplate INSTANCE = new SseEventModelTemplate();

    private SseEventModelTemplate() {
    }

    public static SseEventModelTemplate getInstance() {
        return INSTANCE;
    }

    public void writeBase(SseMetadata metadata, JavaFile javaFile) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        String baseEventName = names.getBaseEventName();
        String serializerName = names.getSerializerName();
        Set<String> imports = new LinkedHashSet<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            Mappers.getSchemaMapper().map(event.getPayload()).getClientType().addImportsTo(imports, false);
        }
        SseUtil.getSerializerType(metadata).addImportsTo(imports, false);
        Annotation.GENERATED.addImportsTo(imports);
        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> {
            comment.description(
                "Base for polymorphic events emitted by a streaming " + names.getStreamDescription() + ".");
            comment
                .description("Known events expose typed payloads through their subtype's {@code getValue()} method.");
            comment.line("Unrecognized events expose only their names through");
            comment.description("{@link #getEventName()}; their payloads are not available and they are not terminal.");
            comment.description(
                "Stream events are envelopes, not JSON payload models; serialize the typed payload instead.");
            for (SseEventMetadata event : metadata.getEvents()) {
                comment.see(names.getEventWrapperName(event.getName()));
            }
        });
        javaFile.publicClass(List.of(JavaModifier.Abstract), baseEventName, javaClass -> {
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.privateFinalMemberVariable("String eventName");
            javaClass.javadocComment(comment -> {
                comment.description("Creates a stream event.");
                comment.param("eventName", "The server-sent event name.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.packagePrivateConstructor(baseEventName + "(String eventName)",
                constructor -> constructor.line("this.eventName = eventName;"));
            javaClass.javadocComment(comment -> {
                comment.description("Gets the server-sent event name.");
                comment.methodReturns("The event name.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod("final String getEventName()", method -> method.methodReturn("eventName"));
            javaClass.javadocComment(comment -> {
                comment.description(
                    "Gets whether this event terminates the " + names.getStreamKindDescription() + " stream.");
                comment.methodReturns("{@code true} if this is a terminal event; otherwise {@code false}.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("false"));
            javaClass.staticBlock(staticBlock -> {
                staticBlock.line(
                    serializerName + ".setConstructorAccessor(new " + serializerName + ".ConstructorAccessor() {");
                staticBlock.indent(() -> {
                    staticBlock.line("@Override");
                    staticBlock.block(
                        "public " + SseUtil.getClientEventTypeName(metadata) + " unknownEvent(String eventName)",
                        method -> method.methodReturn("new " + baseEventName + "(eventName) {}"));
                    for (SseEventMetadata event : metadata.getEvents()) {
                        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                        String payloadTypeName = payloadType.toString();
                        String wrapperName = names.getEventWrapperName(event.getName());
                        staticBlock.line("@Override");
                        staticBlock.block(
                            "public " + wrapperName + " " + SseNamingResolver.getEventFactoryMethodName(event.getName())
                                + "(" + payloadTypeName + " value)",
                            method -> method.methodReturn("new " + wrapperName + "(value)"));
                    }
                });
                staticBlock.line("});");
            });
        });
    }

    public void writeEvent(SseMetadata metadata, SseEventMetadata event, JavaFile javaFile) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
        String payloadTypeName = payloadType.toString();
        Set<String> imports = new LinkedHashSet<>();
        payloadType.addImportsTo(imports, false);
        Annotation.GENERATED.addImportsTo(imports);
        Annotation.IMMUTABLE.addImportsTo(imports);
        javaFile.declareImport(imports);

        String wrapperName = names.getEventWrapperName(event.getName());
        String baseEventTypeName = SseUtil.getClientEventTypeName(metadata);
        javaFile.javadocComment(comment -> {
            comment.description("Represents the {@code " + TemplateUtil.escapeString(event.getName()) + "} "
                + names.getStreamDescription() + " stream event.");
            comment.description("Access the typed payload with {@link #getValue()}.");
            comment.see(baseEventTypeName);
        });
        javaFile.annotation(Annotation.IMMUTABLE.getName());
        javaFile.publicFinalClass(wrapperName + " extends " + baseEventTypeName, javaClass -> {
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.privateFinalMemberVariable(payloadTypeName + " value");
            javaClass.javadocComment(comment -> {
                comment.description("Creates an event wrapper.");
                comment.param("value", "The event payload.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.packagePrivateConstructor(wrapperName + "(" + payloadTypeName + " value)", constructor -> {
                constructor.line("super(\"" + TemplateUtil.escapeString(event.getName()) + "\");");
                constructor.line("this.value = value;");
            });
            javaClass.javadocComment(comment -> {
                comment.description("Gets the event payload.");
                comment.methodReturns("The event payload.");
            });
            javaClass.annotation(Annotation.GENERATED.getName());
            javaClass.publicMethod(payloadTypeName + " getValue()", method -> method.methodReturn("value"));
            if (event.isTerminal()) {
                javaClass.annotation(Annotation.GENERATED.getName());
                javaClass.annotation("Override");
                javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("true"));
            }
        });
    }
}
