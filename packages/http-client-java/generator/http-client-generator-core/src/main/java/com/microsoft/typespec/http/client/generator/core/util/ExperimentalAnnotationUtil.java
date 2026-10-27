// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ApiMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;

/**
 * Writes annotations for experimental APIs.
 */
public final class ExperimentalAnnotationUtil {
    public static final String DEFAULT_WARNING_TEXT = "Preview API - subject to change in non-backwards compatible way";

    private ExperimentalAnnotationUtil() {
    }

    /**
     * Gets the annotation expression for an API.
     *
     * @param metadata the API metadata.
     * @return the annotation expression, or null when no annotation applies.
     */
    public static String getAnnotation(ApiMetadata metadata) {
        String annotation = JavaSettings.getInstance().getExperimentalAnnotation();
        Experimental experimental = metadata == null ? null : metadata.getExperimental();
        if (annotation == null || experimental == null) {
            return null;
        }
        return experimental.getWarningText() == null
            ? annotation
            : annotation + "(warningText = " + ClassType.STRING.defaultValueExpression(experimental.getWarningText())
                + ")";
    }

    /**
     * Writes an API's experimental annotation, if configured.
     *
     * @param context the declaration context.
     * @param metadata the API metadata.
     */
    public static void write(JavaContext context, ApiMetadata metadata) {
        String annotation = getAnnotation(metadata);
        if (annotation != null) {
            context.annotation(annotation);
        }
    }
}
