// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAM_HELPER = "ServerSentEventStreamHelper";

    private SseUtil() {
    }

    public static String getEventPackage(SseMetadata metadata) {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackageName(metadata.getModelNamespace(), settings.getModelsSubpackage());
    }

    public static String getSerializerPackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getImplementationSubpackage());
    }

    public static String getRuntimePackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getModelsSubpackage(), settings.getImplementationSubpackage(), "sse");
    }

    public static ClassType getEventType(SseMetadata metadata, String name) {
        return new ClassType.Builder().packageName(getEventPackage(metadata)).name(name).build();
    }

    public static String getClientEventTypeName(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        return names.getBaseEventName();
    }

    public static ClassType getSerializerType(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        return new ClassType.Builder().packageName(getSerializerPackage()).name(names.getSerializerName()).build();
    }

    public static ClassType getRuntimeType() {
        return new ClassType.Builder().packageName(getRuntimePackage()).name(SERVER_SENT_EVENT_STREAM_HELPER).build();
    }

    public static String getClientTerminalPredicate(ClientMethod method) {
        return getClientEventTypeName(method.getSseMetadata()) + "::isTerminal";
    }
}
