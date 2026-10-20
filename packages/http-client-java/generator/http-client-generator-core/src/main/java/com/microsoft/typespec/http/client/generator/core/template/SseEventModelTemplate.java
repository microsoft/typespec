// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
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
        String baseEventName = SseNamingResolver.resolve(metadata).getBaseEventName();
        javaFile.javadocComment(comment -> comment.description(
            "Base for typed events emitted by a server-sent event stream. Unknown events expose only their name."));
        javaFile.publicClass(List.of(JavaModifier.Abstract), baseEventName, javaClass -> {
            javaClass.privateFinalMemberVariable("String eventName");
            javaClass.packagePrivateConstructor(baseEventName + "(String eventName)",
                constructor -> constructor.line("this.eventName = eventName;"));
            javaClass.javadocComment(comment -> {
                comment.description("Gets the server-sent event name.");
                comment.methodReturns("the server-sent event name");
            });
            javaClass.publicMethod("final String getEventName()", method -> method.methodReturn("eventName"));
            javaClass.javadocComment(comment -> {
                comment.description("Whether this event terminates the stream.");
                comment.methodReturns("whether this event terminates the stream");
            });
            javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("false"));
        });
    }

    public void writeEvent(SseMetadata metadata, SseEventMetadata event, JavaFile javaFile) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
        Set<String> imports = new LinkedHashSet<>();
        payloadType.addImportsTo(imports, false);
        SseUtil.getEventType(names.getBaseEventName()).addImportsTo(imports, false);
        javaFile.declareImport(imports);

        String wrapperName = names.getEventWrapperName(event.getName());
        String baseEventName = names.getBaseEventName();
        javaFile.javadocComment(comment -> comment.description(
            "Represents the {@code " + TemplateUtil.escapeString(event.getName()) + "} server-sent event."));
        javaFile.publicFinalClass(wrapperName + " extends " + baseEventName, javaClass -> {
            javaClass.privateFinalMemberVariable(payloadType + " value");
            javaClass.packagePrivateConstructor(wrapperName + "(" + payloadType + " value)", constructor -> {
                constructor.line("super(\"" + TemplateUtil.escapeString(event.getName()) + "\");");
                constructor.line("this.value = value;");
            });
            javaClass.javadocComment(comment -> {
                comment.description("Gets the decoded event payload.");
                comment.methodReturns("the decoded event payload");
            });
            javaClass.publicMethod(payloadType + " getValue()", method -> method.methodReturn("value"));
            if (event.isTerminal()) {
                javaClass.annotation("Override");
                javaClass.publicMethod("boolean isTerminal()", method -> method.methodReturn("true"));
            }
        });
    }
}
