// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
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
        IType baseEventType = SseUtil.getEventType(metadata.getBaseEventName());
        Set<String> imports = new LinkedHashSet<>();
        imports.add(ClassType.BINARY_DATA.getFullName());
        imports.add("com.azure.core.util.serializer.TypeReference");
        baseEventType.addImportsTo(imports, false);
        for (SseEventMetadata event : metadata.getEvents()) {
            SseUtil.getEventType(event.getWrapperName()).addImportsTo(imports, false);
            Mappers.getSchemaMapper().map(event.getPayload()).getClientType().addImportsTo(imports, false);
        }
        javaFile.declareImport(imports);

        String converterName = SseUtil.getConverterClassName(metadata);
        javaFile
            .javadocComment(comment -> comment.description("Converts named server-sent events into generated models."));
        javaFile.publicFinalClass(converterName, javaClass -> {
            javaClass.privateConstructor(converterName + "()", ignored -> {
            });
            javaClass.publicStaticMethod(baseEventType + " convert(String eventName, String data)", method -> {
                for (SseEventMetadata event : metadata.getEvents()) {
                    String eventName = TemplateUtil.escapeString(event.getName());
                    IType wrapperType = SseUtil.getEventType(event.getWrapperName());
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
                    .map(event -> "event instanceof " + SseUtil.getEventType(event.getWrapperName()))
                    .reduce((left, right) -> left + " || " + right)
                    .orElse("false");
                method.methodReturn(terminalCondition);
            });
        });
    }
}
