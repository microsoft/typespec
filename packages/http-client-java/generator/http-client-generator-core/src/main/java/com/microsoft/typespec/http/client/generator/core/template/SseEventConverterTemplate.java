// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.util.SseNamingResolver;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.LinkedHashSet;
import java.util.Objects;
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
        IType baseEventType = SseUtil.getEventType(metadata, names.getBaseEventName());
        Set<String> imports = new LinkedHashSet<>();
        imports.add("com.azure.json.JsonProviders");
        imports.add("com.azure.json.JsonReader");
        imports.add("com.azure.json.ReadValueCallback");
        imports.add(IOException.class.getName());
        imports.add(UncheckedIOException.class.getName());
        imports.add(Objects.class.getName());
        baseEventType.addImportsTo(imports, false);
        for (SseEventMetadata event : metadata.getEvents()) {
            SseUtil.getEventType(metadata, names.getEventWrapperName(event.getName())).addImportsTo(imports, false);
            Mappers.getSchemaMapper().map(event.getPayload()).getClientType().addImportsTo(imports, false);
        }
        javaFile.declareImport(imports);

        String converterName = names.getConverterName();
        javaFile
            .javadocComment(comment -> comment.description("Converts named server-sent events into generated models."));
        javaFile.publicFinalClass(converterName, javaClass -> {
            javaClass.privateMemberVariable("static volatile ConstructorAccessor constructorAccessor");
            javaClass.privateConstructor(converterName + "()", ignored -> {
            });
            javaClass.interfaceBlock(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Public,
                "ConstructorAccessor", interfaceBlock -> {
                    interfaceBlock.publicMethod(baseEventType + " createEvent(String eventName)");
                    for (SseEventMetadata event : metadata.getEvents()) {
                        IType wrapperType = SseUtil.getEventType(metadata, names.getEventWrapperName(event.getName()));
                        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                        interfaceBlock.publicMethod(
                            wrapperType + " " + SseNamingResolver.getEventFactoryMethodName(event.getName()) + "("
                                + payloadType + " value)");
                    }
                });
            javaClass.publicStaticMethod("void setConstructorAccessor(ConstructorAccessor accessor)", method -> method
                .line("constructorAccessor = Objects.requireNonNull(accessor, \"'accessor' cannot be null.\");"));
            javaClass.staticMethod(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                "ConstructorAccessor getConstructorAccessor()", method -> {
                    method.ifBlock("constructorAccessor == null", block -> block
                        .tryBlock(tryBlock -> tryBlock.line("Class.forName(" + baseEventType
                            + ".class.getName(), true, " + baseEventType + ".class.getClassLoader());"))
                        .catchBlock("ClassNotFoundException e", catchBlock -> catchBlock.line(
                            "throw new IllegalStateException(\"Unable to initialize SSE event constructors.\", e);")));
                    method.ifBlock("constructorAccessor == null", block -> block
                        .line("throw new IllegalStateException(\"SSE event constructors were not registered.\");"));
                    method.methodReturn("constructorAccessor");
                });
            javaClass.publicStaticMethod(baseEventType + " convert(String eventName, String data)", method -> {
                for (SseEventMetadata event : metadata.getEvents()) {
                    String eventName = TemplateUtil.escapeString(event.getName());
                    IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                    method
                        .ifBlock("\"" + eventName + "\".equals(eventName)",
                            block -> block.methodReturn("getConstructorAccessor()."
                                + SseNamingResolver.getEventFactoryMethodName(event.getName())
                                + "(read(eventName, data, " + getJsonReadCallback(payloadType) + "))"));
                }
                method.methodReturn("getConstructorAccessor().createEvent(eventName)");
            });
            javaClass.staticMethod(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                "<T> T read(String eventName, String data, ReadValueCallback<JsonReader, T> eventReader)",
                method -> method
                    .tryBlock("JsonReader reader = JsonProviders.createReader(data)",
                        tryBlock -> tryBlock.methodReturn("eventReader.read(reader)"))
                    .catchBlock("IOException exception",
                        catchBlock -> catchBlock
                            .line("throw new UncheckedIOException(\"Failed to decode server-sent event: \" + eventName,"
                                + " exception);")));
            javaClass.publicStaticMethod("boolean isTerminal(" + baseEventType + " event)", method -> {
                String terminalCondition = metadata.getEvents()
                    .stream()
                    .filter(SseEventMetadata::isTerminal)
                    .map(event -> "event instanceof "
                        + SseUtil.getEventType(metadata, names.getEventWrapperName(event.getName())))
                    .reduce((left, right) -> left + " || " + right)
                    .orElse("false");
                method.methodReturn(terminalCondition);
            });
        });
    }

    private static String getJsonReadCallback(IType type) {
        if (type instanceof IterableType) {
            return "reader -> reader.readArray(" + getJsonReadCallback(((IterableType) type).getElementType()) + ")";
        }
        if (type instanceof ClassType && ((ClassType) type).isSwaggerType()) {
            return type + "::fromJson";
        }
        String deserialization = type.jsonDeserializationMethod("reader");
        if (deserialization == null) {
            throw new IllegalStateException("SSE payload type " + type + " does not support JSON deserialization.");
        }
        return "reader -> " + deserialization;
    }
}
