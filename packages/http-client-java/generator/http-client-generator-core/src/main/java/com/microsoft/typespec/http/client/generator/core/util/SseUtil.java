// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAMS = "ServerSentEventStreams";

    private SseUtil() {
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

    public static Set<String> getGeneratedTypeNames(SseMetadata metadata, SseNamingResolver.Names names) {
        Set<String> generatedTypeNames = new LinkedHashSet<>();
        generatedTypeNames.add(names.getBaseEventName());
        generatedTypeNames.add(names.getConverterName());
        metadata.getEvents().forEach(event -> generatedTypeNames.add(names.getEventWrapperName(event.getName())));
        return generatedTypeNames;
    }

    public static void addPayloadImports(IType type, Set<String> imports, Set<String> fullyQualifiedTypeNames,
        boolean includeImplementationImports) {
        Set<String> payloadImports = new LinkedHashSet<>();
        type.addImportsTo(payloadImports, includeImplementationImports);
        payloadImports.removeIf(
            importName -> fullyQualifiedTypeNames.contains(importName.substring(importName.lastIndexOf('.') + 1)));
        imports.addAll(payloadImports);
    }

    public static String getPayloadTypeName(IType type, Set<String> fullyQualifiedTypeNames) {
        if (type instanceof ClassType) {
            ClassType classType = (ClassType) type;
            return fullyQualifiedTypeNames.contains(classType.getName())
                ? classType.getFullName()
                : classType.getName();
        }
        if (type instanceof EnumType) {
            EnumType enumType = (EnumType) type;
            return fullyQualifiedTypeNames.contains(enumType.getName())
                ? enumType.getPackage() + "." + enumType.getName()
                : enumType.getName();
        }
        if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            return genericType.getName() + "<"
                + Arrays.stream(genericType.getTypeArguments())
                    .map(typeArgument -> getPayloadTypeName(typeArgument.asNullable(), fullyQualifiedTypeNames))
                    .collect(Collectors.joining(", "))
                + ">";
        }
        if (type instanceof ArrayType) {
            return getPayloadTypeName(((ArrayType) type).getElementType(), fullyQualifiedTypeNames) + "[]";
        }
        return type.toString();
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
