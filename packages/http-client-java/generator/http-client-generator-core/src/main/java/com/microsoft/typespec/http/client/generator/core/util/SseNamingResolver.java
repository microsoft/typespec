// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

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

        Map<String, String> eventWrapperNames = new LinkedHashMap<>();
        Map<String, String> wireNamesByWrapperName = new LinkedHashMap<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            String wrapperName = streamEventPrefix + normalizeEventName(event.getName()) + STREAM_EVENT_SUFFIX;
            String collidingWireName = wireNamesByWrapperName.putIfAbsent(wrapperName, event.getName());
            if (wrapperName.equals(baseEventName) || collidingWireName != null) {
                throw new IllegalStateException(
                    "SSE event names '" + (collidingWireName == null ? event.getName() : collidingWireName) + "' and '"
                        + event.getName() + "' resolve to duplicate Java type '" + wrapperName + "'.");
            }
            eventWrapperNames.put(event.getName(), wrapperName);
        }

        return new Names(baseEventName, baseEventName + "Converter", eventWrapperNames);
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

    /**
     * Generated Java names for one SSE stream.
     */
    public static final class Names {
        private final String baseEventName;
        private final String converterName;
        private final Map<String, String> eventWrapperNames;

        private Names(String baseEventName, String converterName, Map<String, String> eventWrapperNames) {
            this.baseEventName = baseEventName;
            this.converterName = converterName;
            this.eventWrapperNames = Collections.unmodifiableMap(eventWrapperNames);
        }

        public String getBaseEventName() {
            return baseEventName;
        }

        public String getConverterName() {
            return converterName;
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
