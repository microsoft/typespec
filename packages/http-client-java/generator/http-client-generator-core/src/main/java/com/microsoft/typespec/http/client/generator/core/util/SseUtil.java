// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;

/**
 * Utilities for experimental server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAMS = "ServerSentEventStreams";

    private SseUtil() {
    }

    /**
     * Gets the generated converter class name for an SSE event union.
     *
     * @param metadata the SSE metadata
     * @return the converter class name
     */
    public static String getConverterClassName(SseMetadata metadata) {
        return metadata.getBaseEventName() + "Converter";
    }

    public static ClassType getEventType(String name) {
        JavaSettings settings = JavaSettings.getInstance();
        return new ClassType.Builder().packageName(settings.getPackage(settings.getModelsSubpackage()))
            .name(name)
            .build();
    }
}
