// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.util.SseNamingResolver;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Writes the converter for a named JSON server-sent event union.
 */
public final class SseEventConverterTemplate implements IJavaTemplate<SseMetadata, JavaFile> {
    private static final SseEventConverterTemplate INSTANCE = new SseEventConverterTemplate();

    private SseEventConverterTemplate() {
    }

    public static SseEventConverterTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(SseMetadata metadata, JavaFile javaFile) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        IType baseEventType = SseUtil.getEventType(names.getBaseEventName());
        Set<String> imports = new LinkedHashSet<>();
        imports.add(ClassType.BINARY_DATA.getFullName());
        imports.add("com.azure.core.util.serializer.TypeReference");
        baseEventType.addImportsTo(imports, false);
        for (SseEventMetadata event : metadata.getEvents()) {
            SseUtil.getEventType(names.getEventWrapperName(event.getName())).addImportsTo(imports, false);
            Mappers.getSchemaMapper().map(event.getPayload()).getClientType().addImportsTo(imports, false);
        }
        javaFile.declareImport(imports);

        String converterName = names.getConverterName();
        javaFile
            .javadocComment(comment -> comment.description("Converts named server-sent events into generated models."));
        javaFile.publicFinalClass(converterName, javaClass -> {
            javaClass.privateConstructor(converterName + "()", ignored -> {
            });
            javaClass.publicStaticMethod(baseEventType + " convert(String eventName, String data)", method -> {
                for (SseEventMetadata event : metadata.getEvents()) {
                    String eventName = TemplateUtil.escapeString(event.getName());
                    IType wrapperType = SseUtil.getEventType(names.getEventWrapperName(event.getName()));
                    IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                    method.ifBlock("\"" + eventName + "\".equals(eventName)",
                        block -> block.methodReturn("new " + wrapperType + "(BinaryData.fromString(data).toObject("
                            + "new TypeReference<" + payloadType + ">() {}))"));
                }
                method.methodReturn("new " + baseEventType + "(eventName) {}");
            });
            javaClass.publicStaticMethod("boolean isTerminal(" + baseEventType + " event)", method -> {
                String terminalCondition = metadata.getEvents()
                    .stream()
                    .filter(SseEventMetadata::isTerminal)
                    .map(
                        event -> "event instanceof " + SseUtil.getEventType(names.getEventWrapperName(event.getName())))
                    .reduce((left, right) -> left + " || " + right)
                    .orElse("false");
                method.methodReturn(terminalCondition);
            });
        });
    }
}
