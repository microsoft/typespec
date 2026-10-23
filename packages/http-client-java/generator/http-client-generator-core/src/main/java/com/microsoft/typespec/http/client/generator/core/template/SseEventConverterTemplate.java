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
        ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        baseEventType.addImportsTo(imports, false);
        for (SseEventMetadata event : metadata.getEvents()) {
            SseUtil.getEventType(metadata, names.getEventWrapperName(event.getName())).addImportsTo(imports, false);
            Mappers.getSchemaMapper().map(event.getPayload()).getClientType().addImportsTo(imports, false);
        }
        javaFile.declareImportPreservingOrder(imports);

        String converterName = names.getConverterName();
        javaFile.javadocComment(comment -> comment
            .description("Converts " + names.getStreamDescription() + " stream event payloads to typed event models."));
        javaFile.publicFinalClass(converterName, javaClass -> {
            javaClass.privateMemberVariables(
                "static final ClientLogger LOGGER = new ClientLogger(" + converterName + ".class)",
                "static volatile ConstructorAccessor constructorAccessor");
            javaClass.privateConstructor(converterName + "()", ignored -> {
            });
            javaClass
                .javadocComment(comment -> comment.description("Provides access to the SDK-only event constructors."));
            javaClass.interfaceBlock(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Public,
                "ConstructorAccessor", interfaceBlock -> {
                    interfaceBlock.javadocComment(comment -> {
                        comment.description("Creates a name-only event.");
                        comment.param("eventName", "The event name.");
                        comment.methodReturns("The event.");
                    });
                    interfaceBlock.publicMethod(baseEventType + " createEvent(String eventName)");
                    for (SseEventMetadata event : metadata.getEvents()) {
                        IType wrapperType = SseUtil.getEventType(metadata, names.getEventWrapperName(event.getName()));
                        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                        interfaceBlock.javadocComment(comment -> {
                            String eventDescription = event.getName().replace('.', '-');
                            comment.description("Creates " + getIndefiniteArticle(eventDescription) + " "
                                + eventDescription + " event.");
                            comment.param("value", "The decoded payload.");
                            comment.methodReturns("The event.");
                        });
                        interfaceBlock.publicMethod(
                            wrapperType + " " + SseNamingResolver.getEventFactoryMethodName(event.getName()) + "("
                                + payloadType + " value)");
                    }
                });
            javaClass.javadocComment(comment -> {
                comment.description("Registers the event constructors from the models package.");
                comment.param("accessor", "The constructor accessor.");
            });
            javaClass.publicStaticMethod("void setConstructorAccessor(ConstructorAccessor accessor)", method -> method
                .line("constructorAccessor = Objects.requireNonNull(accessor, \"'accessor' cannot be null.\");"));
            javaClass.staticMethod(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                "ConstructorAccessor getConstructorAccessor()", method -> {
                    method.line("ConstructorAccessor accessor = constructorAccessor;");
                    method.line("if (accessor == null) {");
                    method.indent(() -> {
                        method.line("try {");
                        method.indent(() -> method.line("Class.forName(" + baseEventType + ".class.getName(), true, "
                            + baseEventType + ".class.getClassLoader());"));
                        method.line("} catch (ClassNotFoundException | LinkageError exception) {");
                        method.indent(() -> method.line(
                            "throw LOGGER.logExceptionAsError(new IllegalStateException(" + "\"Failed to initialize "
                                + names.getStreamDescription() + " stream event constructors.\", exception));"));
                        method.line("}");
                        method.line("accessor = constructorAccessor;");
                        method.line("if (accessor == null) {");
                        method.indent(() -> method.line("throw LOGGER.logExceptionAsError(new IllegalStateException(\""
                            + capitalize(names.getStreamDescription())
                            + " stream event constructors were not registered.\"));"));
                        method.line("}");
                    });
                    method.line("}");
                    method.methodReturn("accessor");
                });
            javaClass.javadocComment(comment -> {
                comment.description("Converts a stream event payload.");
                comment.param("eventName", "The stream event name.");
                comment.param("data", "The stream event data.");
                comment.methodReturns("The typed stream event.");
            });
            javaClass.publicStaticMethod(baseEventType + " convert(String eventName, String data)", method -> {
                method.line("ConstructorAccessor accessor = getConstructorAccessor();");
                method.line("switch (eventName) {");
                method.indent(() -> {
                    for (SseEventMetadata event : metadata.getEvents()) {
                        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                        method.line("case \"" + TemplateUtil.escapeString(event.getName()) + "\":");
                        method.indent(() -> method
                            .methodReturn("accessor." + SseNamingResolver.getEventFactoryMethodName(event.getName())
                                + "(read(eventName, data, " + getJsonReadCallback(payloadType) + "))"));
                        method.line();
                    }
                    method.line("default:");
                    method.indent(() -> method.methodReturn("accessor.createEvent(eventName)"));
                });
                method.line("}");
            });
            javaClass.staticMethod(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                "<T> T read(String eventName, String data, ReadValueCallback<JsonReader, T> eventReader)", method -> {
                    method.line("try (JsonReader reader = JsonProviders.createReader(data)) {");
                    method.indent(() -> method.methodReturn("eventReader.read(reader)"));
                    method.line("} catch (IOException exception) {");
                    method.indent(() -> method.line("throw new UncheckedIOException(\"Failed to decode "
                        + names.getStreamDescription() + " stream event: \" + eventName, exception);"));
                    method.line("}");
                });
            javaClass.blankLine();
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

    private static String getIndefiniteArticle(String value) {
        return value.matches("(?i)^[aeiou].*") ? "an" : "a";
    }

    private static String capitalize(String value) {
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
