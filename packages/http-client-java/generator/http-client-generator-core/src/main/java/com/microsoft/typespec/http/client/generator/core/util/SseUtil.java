// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAM_HELPER = "ServerSentEventStreamHelper";
    private static final String STREAM_EVENT_SUFFIX = "StreamEvent";

    private SseUtil() {
    }

    public static String getEventPackage(SseMetadata metadata) {
        return getEventPackage(metadata.getBaseSchema());
    }

    public static String getEventPackage(ObjectSchema schema) {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackageName(getSchemaNamespace(schema), settings.getModelsSubpackage());
    }

    public static String getSerializerPackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getImplementationSubpackage());
    }

    public static String getRuntimePackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getModelsSubpackage(), settings.getImplementationSubpackage(), "sse");
    }

    public static ClassType getEventType(ObjectSchema schema) {
        return new ClassType.Builder().packageName(getEventPackage(schema)).name(getSchemaName(schema)).build();
    }

    public static String getClientEventTypeName(SseMetadata metadata) {
        return getSchemaName(metadata.getBaseSchema());
    }

    public static ClassType getSerializerType(SseMetadata metadata) {
        return new ClassType.Builder().packageName(getSerializerPackage())
            .name(getClientEventTypeName(metadata) + "Serializer")
            .build();
    }

    public static ClassType getRuntimeType() {
        return new ClassType.Builder().packageName(getRuntimePackage()).name(SERVER_SENT_EVENT_STREAM_HELPER).build();
    }

    public static String getClientTerminalPredicate(ClientMethod method) {
        return getClientEventTypeName(method.getSseMetadata()) + "::isTerminal";
    }

    public static Schema getPayloadSchema(SseEventMetadata event) {
        return getValueProperty(event).getSchema();
    }

    public static Property getValueProperty(SseEventMetadata event) {
        if (event.getEventSchema() != null && event.getEventSchema().getProperties() != null) {
            for (Property property : event.getEventSchema().getProperties()) {
                if (property != null && "value".equals(property.getSerializedName())) {
                    return property;
                }
            }
        }
        throw new IllegalStateException("SSE event '" + event.getName() + "' has no value property.");
    }

    public static ObjectSchema getParentSchema(SseEventMetadata event) {
        if (event.getEventSchema() != null
            && event.getEventSchema().getParents() != null
            && event.getEventSchema().getParents().getImmediate() != null) {
            for (Schema parent : event.getEventSchema().getParents().getImmediate()) {
                if (parent instanceof ObjectSchema) {
                    return (ObjectSchema) parent;
                }
            }
        }
        throw new IllegalStateException("SSE event '" + event.getName() + "' has no object parent schema.");
    }

    public static String getEventFactoryMethodName(String eventName) {
        return "create" + normalizeEventName(eventName);
    }

    public static void validateEventFactoryNames(SseMetadata metadata) {
        Map<String, String> wireNamesByFactoryName = new LinkedHashMap<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            String factoryName = getEventFactoryMethodName(event.getName());
            String collidingWireName = wireNamesByFactoryName.putIfAbsent(factoryName, event.getName());
            if (collidingWireName != null) {
                throw new IllegalStateException("SSE event names '" + collidingWireName + "' and '" + event.getName()
                    + "' resolve to duplicate Java factory method '" + factoryName + "'.");
            }
        }
    }

    public static List<String> getTerminalEventNames(SseMetadata metadata) {
        return metadata.getEvents()
            .stream()
            .filter(SseEventMetadata::isTerminal)
            .map(SseEventMetadata::getName)
            .collect(Collectors.toList());
    }

    public static String getStreamDescription(SseMetadata metadata) {
        String streamName = CodeNamer.toPascalCase(metadata.getStreamName());
        String baseEventName
            = streamName.endsWith("Events") ? streamName.substring(0, streamName.length() - 1) : streamName + "Event";
        baseEventName = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(baseEventName));
        String baseStem = baseEventName.endsWith(STREAM_EVENT_SUFFIX)
            ? baseEventName.substring(0, baseEventName.length() - STREAM_EVENT_SUFFIX.length())
            : baseEventName;
        return baseStem.isEmpty() ? "SSE" : toLowerCaseWords(baseStem);
    }

    public static String getStreamKindDescription(SseMetadata metadata) {
        String description = getStreamDescription(metadata);
        int lastSpace = description.lastIndexOf(' ');
        return lastSpace < 0 ? description : description.substring(lastSpace + 1);
    }

    private static String normalizeEventName(String eventName) {
        StringBuilder normalizedName = new StringBuilder();
        for (String segment : eventName.split("[^A-Za-z0-9]+")) {
            if (!segment.isEmpty()) {
                normalizedName.append(CodeNamer.toPascalCase(segment));
            }
        }
        return normalizedName.toString();
    }

    private static String toLowerCaseWords(String value) {
        return value.replaceAll("(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ").toLowerCase(Locale.ROOT);
    }

    private static String getSchemaName(ObjectSchema schema) {
        return schema.getLanguage().getJava().getName();
    }

    private static String getSchemaNamespace(ObjectSchema schema) {
        return schema.getLanguage().getJava().getNamespace();
    }
}
