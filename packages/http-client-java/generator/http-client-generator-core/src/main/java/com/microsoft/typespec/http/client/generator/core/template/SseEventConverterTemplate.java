// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.util.SseNamingResolver;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Writes the converter for a supported server-sent event union.
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
        boolean direct = SseUtil.isDirect(metadata);
        boolean literals
            = metadata.getEvents().stream().anyMatch(event -> event.getPayload() instanceof ConstantSchema);
        IType baseEventType = SseUtil.getElementType(metadata);
        Set<String> imports = new LinkedHashSet<>();
        imports.add("com.azure.json.JsonProviders");
        imports.add("com.azure.json.JsonReader");
        imports.add("com.azure.json.ReadValueCallback");
        imports.add(IOException.class.getName());
        imports.add(UncheckedIOException.class.getName());
        imports.add(Objects.class.getName());
        if (literals) {
            imports.add("com.azure.json.JsonToken");
            imports.add("java.math.BigDecimal");
        }
        ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        baseEventType.addImportsTo(imports, false);
        for (SseEventMetadata event : metadata.getEvents()) {
            if (!direct) {
                SseUtil.getEventType(metadata, names.getEventWrapperName(event)).addImportsTo(imports, false);
            }
            addPayloadImports(Mappers.getSchemaMapper().map(event.getPayload()).getClientType(), imports);
        }
        javaFile.declareImportPreservingOrder(imports);

        String converterName = names.getConverterName();
        javaFile.javadocComment(comment -> comment
            .description("Converts " + names.getStreamDescription() + " stream event payloads to typed event models."));
        javaFile.publicFinalClass(converterName, javaClass -> {
            if (direct) {
                javaClass.privateConstructor(converterName + "()", ignored -> {
                });
                javaClass.javadocComment(comment -> {
                    comment.description("Converts the default event to its typed payload.");
                    comment.param("eventName", "The stream event name.");
                    comment.param("data", "The JSON payload.");
                    comment.methodReturns("The non-null decoded payload.");
                });
                javaClass.publicStaticMethod(baseEventType + " convert(String eventName, String data)", method -> {
                    method.line("if (eventName != null && !eventName.isEmpty() && !\"message\".equals(eventName)) {");
                    method.indent(() -> method
                        .line("throw new IllegalStateException(\"Unexpected SSE event name: \" + eventName);"));
                    method.line("}");
                    method.line("try (JsonReader reader = JsonProviders.createReader(data)) {");
                    method.indent(() -> {
                        method.line("reader.nextToken();");
                        method.line(baseEventType + " value = readPayload(reader);");
                        method.methodReturn("Objects.requireNonNull(value, \"SSE payload cannot be null.\")");
                    });
                    method.line("} catch (IOException exception) {");
                    method.indent(() -> method
                        .line("throw new UncheckedIOException(\"Failed to decode SSE payload.\", exception);"));
                    method.line("}");
                });
                javaClass.staticMethod(
                    com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                    baseEventType + " readPayload(JsonReader jsonReader) throws IOException", method -> method
                        .methodReturn("jsonReader.getNullable(" + getJsonReadCallback(baseEventType) + ")"));
                return;
            }
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
                    interfaceBlock.publicMethod(baseEventType + " unknownEvent(String eventName)");
                    for (SseEventMetadata event : metadata.getEvents()) {
                        IType wrapperType = SseUtil.getEventType(metadata, names.getEventWrapperName(event));
                        IType payloadType = Mappers.getSchemaMapper().map(event.getPayload()).getClientType();
                        interfaceBlock.javadocComment(comment -> {
                            String eventDescription
                                = SseNamingResolver.getVariantName(metadata, event).replace('.', '-');
                            comment.description("Creates " + getIndefiniteArticle(eventDescription) + " "
                                + eventDescription + " event.");
                            comment.param("value", "The decoded payload.");
                            comment.methodReturns("The event.");
                        });
                        interfaceBlock.publicMethod(
                            wrapperType + " " + SseNamingResolver.getEventFactoryMethodName(metadata, event) + "("
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
                if (metadata.getEvents().stream().anyMatch(event -> "message".equals(event.getWireName()))) {
                    method.line("eventName = eventName == null || eventName.isEmpty() ? \"message\" : eventName;");
                }
                method.line("ConstructorAccessor accessor = getConstructorAccessor();");
                method.line("switch (eventName) {");
                method.indent(() -> {
                    Map<String, List<SseEventMetadata>> identities = new LinkedHashMap<>();
                    metadata.getEvents()
                        .forEach(event -> identities
                            .computeIfAbsent(event.getWireName(), ignored -> new java.util.ArrayList<>())
                            .add(event));
                    for (Map.Entry<String, List<SseEventMetadata>> identity : identities.entrySet()) {
                        method.line("case \"" + TemplateUtil.escapeString(identity.getKey()) + "\":");
                        method.indent(() -> {
                            // Raw literals precede JSON parsing so text markers never enter a JSON reader.
                            identity.getValue()
                                .stream()
                                .filter(event -> event.getPayload() instanceof ConstantSchema)
                                .sorted(java.util.Comparator.comparing(event -> !isRaw(event)))
                                .forEach(event -> {
                                    ConstantSchema constant = (ConstantSchema) event.getPayload();
                                    Object value = constant.getValue().getValue();
                                    IType type = Mappers.getSchemaMapper().map(constant).getClientType();
                                    String expected = "\"" + TemplateUtil.escapeString(String.valueOf(value)) + "\"";
                                    String match = isRaw(event)
                                        ? expected + ".equals(data)"
                                        : "matchesJsonLiteral(data, JsonToken."
                                            + (value instanceof String
                                                ? "STRING"
                                                : value instanceof Boolean ? "BOOLEAN" : "NUMBER")
                                            + ", " + expected + ")";
                                    method.line("if (" + match + ") {");
                                    method.indent(() -> method.methodReturn(
                                        "accessor." + SseNamingResolver.getEventFactoryMethodName(metadata, event) + "("
                                            + type.defaultValueExpression(String.valueOf(value)) + ")"));
                                    method.line("}");
                                });
                            SseEventMetadata general = identity.getValue()
                                .stream()
                                .filter(event -> !(event.getPayload() instanceof ConstantSchema))
                                .findFirst()
                                .orElse(null);
                            if (general == null) {
                                method.line(
                                    "throw new IllegalStateException(\"Invalid payload for SSE event: \" + eventName);");
                            } else {
                                IType payloadType = Mappers.getSchemaMapper().map(general.getPayload()).getClientType();
                                method.methodReturn(
                                    "accessor." + SseNamingResolver.getEventFactoryMethodName(metadata, general)
                                        + "(read(eventName, data, " + getJsonReadCallback(payloadType) + "))");
                            }
                        });
                        method.line();
                    }
                    method.line("default:");
                    method.indent(() -> method.methodReturn("accessor.unknownEvent(eventName)"));
                });
                method.line("}");
            });
            if (literals) {
                javaClass.staticMethod(
                    com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                    "boolean matchesJsonLiteral(String data, JsonToken kind, String expected)", method -> {
                        method.line("try (JsonReader reader = JsonProviders.createReader(data)) {");
                        method.indent(() -> {
                            method.line("if (reader.nextToken() != kind) {");
                            method.indent(() -> method.methodReturn("false"));
                            method.line("}");
                            method.line("boolean matches;");
                            method.line("if (kind == JsonToken.NUMBER) {");
                            method.indent(() -> method.line(
                                "matches = new BigDecimal(expected).compareTo(new BigDecimal(reader.getText())) == 0;"));
                            method.line("} else if (kind == JsonToken.BOOLEAN) {");
                            method.indent(
                                () -> method.line("matches = Boolean.parseBoolean(expected) == reader.getBoolean();"));
                            method.line("} else {");
                            method.indent(() -> method.line("matches = expected.equals(reader.getString());"));
                            method.line("}");
                            method.line("if (reader.nextToken() != JsonToken.END_DOCUMENT) {");
                            method.indent(() -> method
                                .line("throw new IllegalStateException(\"Trailing JSON content in SSE literal.\");"));
                            method.line("}");
                            method.methodReturn("matches");
                        });
                        method.line("} catch (IOException exception) {");
                        method.indent(() -> method
                            .line("throw new UncheckedIOException(\"Invalid JSON SSE literal.\", exception);"));
                        method.line("}");
                    });
            }
            javaClass.staticMethod(
                com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility.Private,
                "<T> T read(String eventName, String data, ReadValueCallback<JsonReader, T> eventReader)", method -> {
                    method.line("try (JsonReader reader = JsonProviders.createReader(data)) {");
                    method.indent(() -> {
                        method.line("reader.nextToken();");
                        method.methodReturn("eventReader.read(reader)");
                    });
                    method.line("} catch (IOException exception) {");
                    method.indent(() -> method.line("throw new UncheckedIOException(\"Failed to decode "
                        + names.getStreamDescription() + " stream event: \" + eventName, exception);"));
                    method.line("}");
                });
            javaClass.blankLine();
        });
    }

    private static boolean isRaw(SseEventMetadata event) {
        return event.getPayloadContentType().split(";")[0].trim().equalsIgnoreCase("text/plain");
    }

    private static void addPayloadImports(IType type, Set<String> imports) {
        type.addImportsTo(imports, false);
        if (type instanceof IterableType) {
            addPayloadImports(((IterableType) type).getElementType(), imports);
        } else if (type instanceof MapType) {
            addPayloadImports(((MapType) type).getValueType(), imports);
        } else if (ClassType.DATE_TIME.equals(type)) {
            ClassType.CORE_UTILS.addImportsTo(imports, false);
        }
    }

    private static String getJsonReadCallback(IType type) {
        return getJsonReadCallback(type, 0);
    }

    private static String getJsonReadCallback(IType type, int depth) {
        String readerName = depth == 0 ? "reader" : "reader" + depth;
        if (type instanceof IterableType) {
            return readerName + " -> " + readerName + ".readArray("
                + getJsonReadCallback(((IterableType) type).getElementType(), depth + 1) + ")";
        }
        if (type instanceof MapType) {
            return readerName + " -> " + readerName + ".readMap("
                + getJsonReadCallback(((MapType) type).getValueType(), depth + 1) + ")";
        }
        if (type instanceof ClassType && ((ClassType) type).isSwaggerType()) {
            return type + "::fromJson";
        }
        String deserialization = type.jsonDeserializationMethod(readerName);
        if (deserialization == null) {
            throw new IllegalStateException("SSE payload type " + type + " does not support JSON deserialization.");
        }
        return readerName + " -> " + deserialization;
    }

    private static String getIndefiniteArticle(String value) {
        return value.matches("(?i)^(a|e|i|o|u).*") ? "an" : "a";
    }

    private static String capitalize(String value) {
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
