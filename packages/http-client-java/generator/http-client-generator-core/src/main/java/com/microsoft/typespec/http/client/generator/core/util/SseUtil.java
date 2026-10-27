// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAMS = "ServerSentEventStreams";

    private SseUtil() {
    }

    public static String escapePackageRootParameterName(String name, Parameter parameter) {
        JavaSettings settings = JavaSettings.getInstance();
        if (parameter.getOperation() == null
            || parameter.getOperation().getSseMetadata() == null
            || parameter.getImplementation() == Parameter.ImplementationLocation.CLIENT
            || !settings.isAzureV1()) {
            return name;
        }
        String root = settings.getPackage().split("\\.", 2)[0];
        if (shadowsPackageRoot(name, root) || shadowsPackageRoot(name, "reactor")) {
            return name + "Param";
        }
        return name;
    }

    private static boolean shadowsPackageRoot(String name, String root) {
        // Escape the suffix chain too, so SSE inputs containing both com and comParam remain unambiguous.
        return name.startsWith(root) && name.substring(root.length()).matches("(Param)*");
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

    public static String getClientEventTypeName(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        return getEventType(metadata, names.getBaseEventName()).getFullName();
    }

    public static String getClientConverterTypeName(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        return getConverterPackage() + "." + names.getConverterName();
    }

    public static String getClientRuntimeTypeName() {
        return getRuntimePackage() + "." + SERVER_SENT_EVENT_STREAMS;
    }

    public static String getClientTerminalPredicate(ClientMethod method) {
        String eventType = getClientEventTypeName(method.getSseMetadata());
        Set<String> usedNames = MethodUtil.getMethodVariableNames(method);
        if (!usedNames.contains(eventType.substring(0, eventType.indexOf('.')))) {
            return eventType + "::isTerminal";
        }
        String eventName = MethodUtil.getAvailableVariableName("event", usedNames);
        return eventName + " -> " + eventName + ".isTerminal()";
    }

    public static String getClientReturnTypeName(ClientMethod method) {
        if (method.getSseMetadata() == null) {
            return method.getReturnValue().getType().toString();
        }
        return getFullyQualifiedTypeName(method.getReturnValue().getType());
    }

    public static void addPayloadImports(IType type, Set<String> imports, boolean includeImplementationImports) {
        Set<String> payloadImports = new LinkedHashSet<>();
        type.addImportsTo(payloadImports, includeImplementationImports);
        Set<String> userDefinedImports = new LinkedHashSet<>();
        collectUserDefinedTypeNames(type, userDefinedImports);
        payloadImports.removeAll(userDefinedImports);
        imports.addAll(payloadImports);
    }

    public static String getPayloadTypeName(IType type) {
        if (type instanceof ClassType) {
            ClassType classType = (ClassType) type;
            return classType.isSwaggerType() ? classType.getFullName() : classType.getName();
        }
        if (type instanceof EnumType) {
            EnumType enumType = (EnumType) type;
            return getFullName(enumType.getPackage(), enumType.getName());
        }
        if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            return genericType.getName() + "<"
                + Arrays.stream(genericType.getTypeArguments())
                    .map(typeArgument -> getPayloadTypeName(typeArgument.asNullable()))
                    .collect(Collectors.joining(", "))
                + ">";
        }
        if (type instanceof ArrayType) {
            return getPayloadTypeName(((ArrayType) type).getElementType()) + "[]";
        }
        return type.toString();
    }

    private static String getFullyQualifiedTypeName(IType type) {
        if (type instanceof ClassType) {
            return ((ClassType) type).getFullName();
        }
        if (type instanceof EnumType) {
            EnumType enumType = (EnumType) type;
            return getFullName(enumType.getPackage(), enumType.getName());
        }
        if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            return getFullName(genericType.getPackage(), genericType.getName()) + "<"
                + Arrays.stream(genericType.getTypeArguments())
                    .map(typeArgument -> getFullyQualifiedTypeName(typeArgument.asNullable()))
                    .collect(Collectors.joining(", "))
                + ">";
        }
        if (type instanceof ArrayType) {
            return getFullyQualifiedTypeName(((ArrayType) type).getElementType()) + "[]";
        }
        return type.toString();
    }

    private static void collectUserDefinedTypeNames(IType type, Set<String> typeNames) {
        if (type instanceof ClassType) {
            ClassType classType = (ClassType) type;
            if (classType.isSwaggerType()) {
                typeNames.add(classType.getFullName());
            }
        } else if (type instanceof EnumType) {
            EnumType enumType = (EnumType) type;
            typeNames.add(getFullName(enumType.getPackage(), enumType.getName()));
        } else if (type instanceof GenericType) {
            Arrays.stream(((GenericType) type).getTypeArguments())
                .forEach(typeArgument -> collectUserDefinedTypeNames(typeArgument, typeNames));
        } else if (type instanceof ArrayType) {
            collectUserDefinedTypeNames(((ArrayType) type).getElementType(), typeNames);
        }
    }

    private static String getFullName(String packageName, String name) {
        return packageName == null || packageName.isEmpty() ? name : packageName + "." + name;
    }
}
