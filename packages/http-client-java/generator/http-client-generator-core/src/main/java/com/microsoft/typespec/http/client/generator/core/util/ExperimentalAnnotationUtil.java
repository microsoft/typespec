// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ApiMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import java.util.Set;

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
        String name = annotation.substring(annotation.lastIndexOf('.') + 1);
        String warningText = experimental.getWarningText() == null
            ? name + ".WARNING_TEXT"
            : ClassType.STRING.defaultValueExpression(experimental.getWarningText());
        return name + "(warningText = " + warningText + ")";
    }

    /**
     * Adds the experimental annotation import when it applies to an API.
     *
     * @param imports the imports being collected.
     * @param metadata the API metadata.
     */
    public static void addImportsTo(Set<String> imports, ApiMetadata metadata) {
        if (getAnnotation(metadata) != null) {
            imports.add(JavaSettings.getInstance().getExperimentalAnnotation());
        }
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
