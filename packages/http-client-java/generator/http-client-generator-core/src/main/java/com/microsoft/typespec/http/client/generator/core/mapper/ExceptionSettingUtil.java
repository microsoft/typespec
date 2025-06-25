// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for reading exception settings from {@link JavaSettings}.
 */
final class ExceptionSettingUtil {
    private ExceptionSettingUtil() {
    }

    /**
     * Gets the default HTTP exception type from the given settings.
     *
     * @param settings the Java settings.
     * @return the default HTTP exception type, or null if not specified in the settings.
     */
    static ClassType getDefaultHttpExceptionType(JavaSettings settings) {
        String defaultHttpExceptionType = settings.getDefaultHttpExceptionType();
        return CoreUtils.isNullOrEmpty(defaultHttpExceptionType)
            ? null
            : createExceptionTypeFromFullyQualifiedClass(defaultHttpExceptionType);
    }

    /**
     * Gets the mapping of HTTP status codes to exception types from the given settings.
     *
     * @param settings the Java settings.
     * @return a map of HTTP status codes to exception types.
     */
    static Map<Integer, ClassType> getHttpStatusToExceptionTypeMapping(JavaSettings settings) {
        final Map<Integer, ClassType> exceptionMapping = new HashMap<>();
        if (settings.isUseDefaultHttpStatusCodeToExceptionTypeMapping()) {
            // add default mapping, this may get overwritten if custom mapping is provided.
            exceptionMapping.put(401, ClassType.CLIENT_AUTHENTICATION_EXCEPTION);
            exceptionMapping.put(404, ClassType.RESOURCE_NOT_FOUND_EXCEPTION);
            exceptionMapping.put(409, ClassType.RESOURCE_MODIFIED_EXCEPTION);
        }
        final Map<Integer, String> customExceptionMapping = settings.getHttpStatusCodeToExceptionTypeMapping();
        if (!CoreUtils.isNullOrEmpty(customExceptionMapping)) {
            for (Map.Entry<Integer, String> e : customExceptionMapping.entrySet()) {
                final int statusCode = e.getKey();
                final String exceptionClassName = e.getValue();
                exceptionMapping.put(statusCode, createExceptionTypeFromFullyQualifiedClass(exceptionClassName));
            }
        }
        return exceptionMapping;
    }

    /**
     * Creates a ClassType from a fully qualified class name.
     *
     * @param fullyQualifiedClass the fully qualified exception class name.
     * @return the ClassType representing the given class name.
     */
    private static ClassType createExceptionTypeFromFullyQualifiedClass(String fullyQualifiedClass) {
        int classStart = fullyQualifiedClass.lastIndexOf(".");
        return new ClassType.Builder().packageName(fullyQualifiedClass.substring(0, classStart))
            .name(fullyQualifiedClass.substring(classStart + 1))
            .build();
    }
}
