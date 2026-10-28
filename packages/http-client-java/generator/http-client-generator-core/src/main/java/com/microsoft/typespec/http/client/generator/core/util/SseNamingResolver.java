// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Resolves generated Java names for a named server-sent event stream.
 */
public final class SseNamingResolver {
    private static final String STREAM_EVENT_SUFFIX = "StreamEvent";

    private SseNamingResolver() {
    }

    /**
     * Resolves and validates all generated names for an SSE stream.
     *
     * @param metadata the semantic SSE metadata
     * @return the resolved generated names
     */
    public static Names resolve(SseMetadata metadata) {
        String streamName = CodeNamer.toPascalCase(metadata.getStreamName());
        String baseEventName
            = streamName.endsWith("Events") ? streamName.substring(0, streamName.length() - 1) : streamName + "Event";
        baseEventName = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(baseEventName));
        String baseStem = baseEventName.endsWith(STREAM_EVENT_SUFFIX)
            ? baseEventName.substring(0, baseEventName.length() - STREAM_EVENT_SUFFIX.length())
            : baseEventName;

        Map<String, String> eventWrapperNames = new LinkedHashMap<>();
        Map<String, String> wireNamesByWrapperName = new LinkedHashMap<>();
        Map<String, String> wireNamesByFactoryName = new LinkedHashMap<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            String streamEventPrefix = baseStem;
            String firstSegment = firstEventNameSegment(event.getName());
            if (!firstSegment.isEmpty() && baseStem.endsWith(firstSegment)) {
                streamEventPrefix = baseStem.substring(0, baseStem.length() - firstSegment.length());
            }
            String wrapperName = streamEventPrefix + normalizeEventName(event.getName()) + STREAM_EVENT_SUFFIX;
            wrapperName = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(wrapperName));
            String collidingWireName = wireNamesByWrapperName.putIfAbsent(wrapperName, event.getName());
            if (wrapperName.equals(baseEventName) || collidingWireName != null) {
                throw new IllegalStateException(
                    "SSE event names '" + (collidingWireName == null ? event.getName() : collidingWireName) + "' and '"
                        + event.getName() + "' resolve to duplicate Java type '" + wrapperName + "'.");
            }
            String factoryName = getEventFactoryMethodName(event.getName());
            String collidingFactoryWireName = wireNamesByFactoryName.putIfAbsent(factoryName, event.getName());
            if (collidingFactoryWireName != null) {
                throw new IllegalStateException("SSE event names '" + collidingFactoryWireName + "' and '"
                    + event.getName() + "' resolve to duplicate Java factory method '" + factoryName + "'.");
            }
            eventWrapperNames.put(event.getName(), wrapperName);
        }

        String streamDescription = baseStem.isEmpty() ? "SSE" : toLowerCaseWords(baseStem);
        return new Names(baseEventName, baseEventName + "Serializer", streamDescription, eventWrapperNames);
    }

    private static String firstEventNameSegment(String eventName) {
        for (String segment : eventName.split("[^A-Za-z0-9]+")) {
            if (!segment.isEmpty()) {
                return CodeNamer.toPascalCase(segment);
            }
        }
        return "";
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

    public static String getEventFactoryMethodName(String eventName) {
        return "create" + normalizeEventName(eventName);
    }

    public static List<String> getTerminalEventNames(SseMetadata metadata) {
        return metadata.getEvents()
            .stream()
            .filter(SseEventMetadata::isTerminal)
            .map(SseEventMetadata::getName)
            .collect(Collectors.toList());
    }

    private static String toLowerCaseWords(String value) {
        return value.replaceAll("(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ").toLowerCase(Locale.ROOT);
    }

    /**
     * Generated Java names for one SSE stream.
     */
    public static final class Names {
        private final String baseEventName;
        private final String serializerName;
        private final String streamDescription;
        private final Map<String, String> eventWrapperNames;

        private Names(String baseEventName, String serializerName, String streamDescription,
            Map<String, String> eventWrapperNames) {
            this.baseEventName = baseEventName;
            this.serializerName = serializerName;
            this.streamDescription = streamDescription;
            this.eventWrapperNames = Collections.unmodifiableMap(eventWrapperNames);
        }

        public String getBaseEventName() {
            return baseEventName;
        }

        public String getSerializerName() {
            return serializerName;
        }

        public String getStreamDescription() {
            return streamDescription;
        }

        public String getStreamKindDescription() {
            int lastSpace = streamDescription.lastIndexOf(' ');
            return lastSpace < 0 ? streamDescription : streamDescription.substring(lastSpace + 1);
        }

        public String getEventWrapperName(String eventName) {
            String wrapperName = eventWrapperNames.get(eventName);
            if (wrapperName == null) {
                throw new IllegalArgumentException("Unknown SSE event name '" + eventName + "'.");
            }
            return wrapperName;
        }
    }
}
