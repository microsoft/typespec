// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAMS = "ServerSentEventStreams";
    private static final Set<String> TEMPLATE_DECLARED_TYPE_NAMES = Set.of("ConstructorAccessor", "String", "Boolean",
        "Byte", "Character", "Double", "Float", "Integer", "Long", "Object", "Short", "Void", "Class",
        "ClassNotFoundException", "LinkageError", "IllegalStateException", "Override");
    private static final Set<String> TEMPLATE_IMPORTS
        = Set.of("com.azure.json.JsonProviders", "com.azure.json.JsonReader", "com.azure.json.ReadValueCallback",
            "java.io.IOException", "java.io.UncheckedIOException", "java.util.Objects");

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

    public static boolean shouldFullyQualifyClientEvent(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        ClientModel collidingModel = ClientModelUtil.getClientModel(names.getBaseEventName());
        return collidingModel != null && !collidingModel.getPackage().equals(getEventPackage(metadata));
    }

    public static String getClientEventTypeName(SseMetadata metadata) {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        ClassType eventType = getEventType(metadata, names.getBaseEventName());
        return shouldFullyQualifyClientEvent(metadata) ? eventType.getFullName() : eventType.getName();
    }

    public static String getClientReturnTypeName(ClientMethod method) {
        if (method.getSseMetadata() == null || !shouldFullyQualifyClientEvent(method.getSseMetadata())) {
            return method.getReturnValue().getType().toString();
        }
        SseMetadata metadata = method.getSseMetadata();
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        String eventTypeName = getEventType(metadata, names.getBaseEventName()).getFullName();
        return getPayloadTypeName(method.getReturnValue().getType(), Set.of(eventTypeName));
    }

    public static void removeFullyQualifiedClientEventImport(ClientMethod method, Set<String> imports) {
        if (method.getSseMetadata() != null && shouldFullyQualifyClientEvent(method.getSseMetadata())) {
            SseMetadata metadata = method.getSseMetadata();
            imports
                .remove(getEventType(metadata, SseNamingResolver.resolve(metadata).getBaseEventName()).getFullName());
        }
    }

    public static Set<String> getFullyQualifiedPayloadTypeNames(SseMetadata metadata, SseNamingResolver.Names names) {
        Set<String> reservedSimpleNames = new LinkedHashSet<>(TEMPLATE_DECLARED_TYPE_NAMES);
        reservedSimpleNames.add(names.getBaseEventName());
        reservedSimpleNames.add(names.getConverterName());
        metadata.getEvents().forEach(event -> reservedSimpleNames.add(names.getEventWrapperName(event.getName())));

        Set<String> fullyQualifiedTypeNames = new LinkedHashSet<>();
        Map<String, String> importsBySimpleName = new HashMap<>();
        Set<String> preferredImports = new LinkedHashSet<>();
        TEMPLATE_IMPORTS.forEach(importName -> trackImport(importName, true, importsBySimpleName, preferredImports,
            reservedSimpleNames, fullyQualifiedTypeNames));
        trackImport(ClassType.CLIENT_LOGGER.getFullName(), true, importsBySimpleName, preferredImports,
            reservedSimpleNames, fullyQualifiedTypeNames);
        trackImport(Annotation.GENERATED.getFullName(), true, importsBySimpleName, preferredImports,
            reservedSimpleNames, fullyQualifiedTypeNames);
        trackImport(Annotation.IMMUTABLE.getFullName(), true, importsBySimpleName, preferredImports,
            reservedSimpleNames, fullyQualifiedTypeNames);
        metadata.getEvents().forEach(event -> {
            IType wirePayloadType = Mappers.getSchemaMapper().map(event.getPayload());
            trackTypeImports(wirePayloadType, importsBySimpleName, preferredImports, reservedSimpleNames,
                fullyQualifiedTypeNames);
            trackTypeImports(wirePayloadType.getClientType(), importsBySimpleName, preferredImports,
                reservedSimpleNames, fullyQualifiedTypeNames);
            if (wirePayloadType.contains(ClassType.DATE_TIME)) {
                trackImport(ClassType.CORE_UTILS.getFullName(), true, importsBySimpleName, preferredImports,
                    reservedSimpleNames, fullyQualifiedTypeNames);
            }
        });
        return fullyQualifiedTypeNames;
    }

    public static void addPayloadImports(IType type, Set<String> imports, Set<String> fullyQualifiedTypeNames,
        boolean includeImplementationImports) {
        Set<String> payloadImports = new LinkedHashSet<>();
        type.addImportsTo(payloadImports, includeImplementationImports);
        payloadImports.removeIf(fullyQualifiedTypeNames::contains);
        imports.addAll(payloadImports);
    }

    public static String getPayloadTypeName(IType type, Set<String> fullyQualifiedTypeNames) {
        if (type instanceof ClassType) {
            ClassType classType = (ClassType) type;
            return fullyQualifiedTypeNames.contains(classType.getFullName())
                ? classType.getFullName()
                : classType.getName();
        }
        if (type instanceof EnumType) {
            EnumType enumType = (EnumType) type;
            String fullName = enumType.getPackage() + "." + enumType.getName();
            return fullyQualifiedTypeNames.contains(fullName) ? fullName : enumType.getName();
        }
        if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            String fullName = genericType.getPackage() + "." + genericType.getName();
            String typeName = fullyQualifiedTypeNames.contains(fullName) ? fullName : genericType.getName();
            return typeName + "<"
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

    private static void trackTypeImports(IType type, Map<String, String> importsBySimpleName,
        Set<String> preferredImports, Set<String> reservedSimpleNames, Set<String> fullyQualifiedTypeNames) {
        Set<String> imports = new LinkedHashSet<>();
        type.addImportsTo(imports, false);
        Set<String> preferredTypeImports = new LinkedHashSet<>();
        collectPreferredTypeImports(type, preferredTypeImports);
        imports.forEach(importName -> trackImport(importName, preferredTypeImports.contains(importName),
            importsBySimpleName, preferredImports, reservedSimpleNames, fullyQualifiedTypeNames));
    }

    private static void trackImport(String importName, boolean preferred, Map<String, String> importsBySimpleName,
        Set<String> preferredImports, Set<String> reservedSimpleNames, Set<String> fullyQualifiedTypeNames) {
        String simpleName = importName.substring(importName.lastIndexOf('.') + 1);
        if (reservedSimpleNames.contains(simpleName) && !preferred) {
            fullyQualifiedTypeNames.add(importName);
        }
        String existingImport = importsBySimpleName.putIfAbsent(simpleName, importName);
        if (preferred) {
            preferredImports.add(importName);
        }
        if (existingImport != null && !existingImport.equals(importName)) {
            boolean existingPreferred = preferredImports.contains(existingImport);
            if (existingPreferred && !preferred) {
                fullyQualifiedTypeNames.add(importName);
            } else if (!existingPreferred && preferred) {
                fullyQualifiedTypeNames.add(existingImport);
                importsBySimpleName.put(simpleName, importName);
            } else {
                fullyQualifiedTypeNames.add(existingImport);
                fullyQualifiedTypeNames.add(importName);
            }
        }
    }

    private static void collectPreferredTypeImports(IType type, Set<String> preferredImports) {
        if (type instanceof ClassType) {
            ClassType classType = (ClassType) type;
            if (!classType.isSwaggerType()) {
                classType.addImportsTo(preferredImports, false);
            }
        } else if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            preferredImports.add(genericType.getPackage() + "." + genericType.getName());
            Arrays.stream(genericType.getTypeArguments())
                .forEach(typeArgument -> collectPreferredTypeImports(typeArgument, preferredImports));
        } else if (type instanceof ArrayType) {
            collectPreferredTypeImports(((ArrayType) type).getElementType(), preferredImports);
        }
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
