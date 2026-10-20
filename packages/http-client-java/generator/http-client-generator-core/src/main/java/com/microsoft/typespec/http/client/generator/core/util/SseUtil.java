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

    public static String getEventPackage(SseMetadata metadata) {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackageName(metadata.getModelNamespace(), settings.getModelsSubpackage());
    }

    public static String getConverterPackage(SseMetadata metadata) {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackageName(metadata.getClientNamespace(), settings.getImplementationSubpackage());
    }

    public static String getRuntimePackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getModelsSubpackage(), settings.getImplementationSubpackage(), "sse");
    }

    public static ClassType getEventType(SseMetadata metadata, String name) {
        return new ClassType.Builder().packageName(getEventPackage(metadata)).name(name).build();
    }
}
