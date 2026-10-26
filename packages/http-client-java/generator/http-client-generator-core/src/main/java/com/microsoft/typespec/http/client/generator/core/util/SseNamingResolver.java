// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
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

        String streamEventPrefix = baseStem;
        for (SseEventMetadata event : metadata.getEvents()) {
            String firstSegment = firstEventNameSegment(event.getName());
            if (!firstSegment.isEmpty() && baseStem.endsWith(firstSegment)) {
                streamEventPrefix = baseStem.substring(0, baseStem.length() - firstSegment.length());
                break;
            }
        }

        Map<SseEventMetadata, String> eventWrapperNames = new LinkedHashMap<>();
        Map<String, String> wireNamesByWrapperName = new LinkedHashMap<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            String variantName = getVariantName(metadata, event);
            String wrapperName = streamEventPrefix + normalizeEventName(variantName) + STREAM_EVENT_SUFFIX;
            wrapperName = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(wrapperName));
            String collidingWireName = wireNamesByWrapperName.putIfAbsent(wrapperName, variantName);
            if (wrapperName.equals(baseEventName) || collidingWireName != null) {
                throw new IllegalStateException(
                    "SSE event names '" + (collidingWireName == null ? event.getName() : collidingWireName) + "' and '"
                        + event.getName() + "' resolve to duplicate Java type '" + wrapperName + "'.");
            }
            eventWrapperNames.put(event, wrapperName);
        }

        return new Names(baseEventName, baseEventName + "Converter", toLowerCaseWords(baseStem), eventWrapperNames);
    }

    private static String firstEventNameSegment(String eventName) {
        if (eventName == null) {
            return "";
        }
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

    public static String getVariantName(SseMetadata metadata, SseEventMetadata event) {
        return event.getName() == null || event.getName().isEmpty()
            ? event.getPayload() instanceof ConstantSchema
                ? "Literal" + (metadata.getEvents().indexOf(event) + 1)
                : "Default"
            : event.getName();
    }

    public static String getEventFactoryMethodName(SseMetadata metadata, SseEventMetadata event) {
        return getEventFactoryMethodName(getVariantName(metadata, event));
    }

    public static String getServiceImplementationMethodName(String wrapperMethodName) {
        if (wrapperMethodName.endsWith("InternalAsync")) {
            return wrapperMethodName.substring(0, wrapperMethodName.length() - "InternalAsync".length()) + "Async";
        }
        if (wrapperMethodName.endsWith("Internal")) {
            return wrapperMethodName.substring(0, wrapperMethodName.length() - "Internal".length());
        }
        return wrapperMethodName;
    }

    public static String getRepresentativeEventName(SseMetadata metadata) {
        SseEventMetadata event = getRepresentativeEvent(metadata);
        return event == null ? null : event.getWireName();
    }

    public static SseEventMetadata getRepresentativeEvent(SseMetadata metadata) {
        SseEventMetadata representativeEvent = null;
        SseEventMetadata scalarEvent = null;
        for (SseEventMetadata event : metadata.getEvents()) {
            if (!event.isTerminal()) {
                representativeEvent = event;
                if (!(event.getPayload() instanceof ArraySchema)) {
                    scalarEvent = event;
                }
            }
        }
        return scalarEvent == null ? representativeEvent : scalarEvent;
    }

    public static List<String> getTerminalEventNames(SseMetadata metadata) {
        return metadata.getEvents()
            .stream()
            .filter(SseEventMetadata::isTerminal)
            .map(SseEventMetadata::getWireName)
            .sorted((left, right) -> {
                if (left.equals(right)) {
                    return 0;
                }
                return "error".equals(left) ? -1 : "error".equals(right) ? 1 : 0;
            })
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
        private final String converterName;
        private final String streamDescription;
        private final Map<SseEventMetadata, String> eventWrapperNames;

        private Names(String baseEventName, String converterName, String streamDescription,
            Map<SseEventMetadata, String> eventWrapperNames) {
            this.baseEventName = baseEventName;
            this.converterName = converterName;
            this.streamDescription = streamDescription;
            this.eventWrapperNames = Collections.unmodifiableMap(eventWrapperNames);
        }

        public String getBaseEventName() {
            return baseEventName;
        }

        public String getConverterName() {
            return converterName;
        }

        public String getStreamDescription() {
            return streamDescription;
        }

        public String getStreamKindDescription() {
            int lastSpace = streamDescription.lastIndexOf(' ');
            return lastSpace < 0 ? streamDescription : streamDescription.substring(lastSpace + 1);
        }

        public String getEventWrapperName(String eventName) {
            return eventWrapperNames.entrySet()
                .stream()
                .filter(entry -> java.util.Objects.equals(entry.getKey().getName(), eventName))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown SSE event name '" + eventName + "'."));
        }

        public String getEventWrapperName(SseEventMetadata event) {
            String wrapperName = eventWrapperNames.get(event);
            if (wrapperName == null) {
                throw new IllegalArgumentException("Unknown SSE event variant.");
            }
            return wrapperName;
        }
    }
}
