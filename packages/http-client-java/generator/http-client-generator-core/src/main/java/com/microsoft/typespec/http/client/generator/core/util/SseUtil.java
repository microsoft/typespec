// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import java.util.Locale;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAMS = "ServerSentEventStreams";

    private SseUtil() {
    }

    public static boolean isDirect(SseMetadata metadata) {
        return metadata.getEvents().size() == 1
            && metadata.getEvents().get(0).getName() == null
            && !(metadata.getEvents().get(0).getPayload() instanceof ConstantSchema);
    }

    public static IType getElementType(SseMetadata metadata) {
        return isDirect(metadata)
            ? Mappers.getSchemaMapper().map(metadata.getEvents().get(0).getPayload()).getClientType().asNullable()
            : getEventType(metadata, SseNamingResolver.resolve(metadata).getBaseEventName());
    }

    public static String getTerminalPredicate(SseMetadata metadata) {
        if (isDirect(metadata)) {
            return metadata.getEvents().get(0).isTerminal() ? ", value -> true" : "";
        }
        return ", " + SseNamingResolver.resolve(metadata).getBaseEventName() + "::isTerminal";
    }

    public static String getEventPackage(SseMetadata metadata) {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackageName(metadata.getModelNamespace(), settings.getModelsSubpackage());
    }

    public static String getConverterPackage() {
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

    public static boolean isSseMethod(ClientMethod method) {
        if (method.getSseMetadata() != null) {
            return true;
        }
        return method.getProxyMethod() != null
            && method.getProxyMethod().getResponseContentTypes() != null
            && method.getProxyMethod()
                .getResponseContentTypes()
                .stream()
                .map(contentType -> contentType.toLowerCase(Locale.ROOT))
                .anyMatch(contentType -> contentType.startsWith("text/event-stream"));
    }
}
