// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;

public interface NeedsPlainObjectCheck {
    /**
     * Check that the type can be regarded as a plain java.lang.Object.
     *
     * @param compositeType The type to check.
     */
    default boolean isPlainObject(ObjectSchema compositeType) {
        return !JavaSettings.getInstance().isDataPlaneClient()
                && compositeType.getProperties().isEmpty() && compositeType.getDiscriminator() == null
                && compositeType.getParents() == null && compositeType.getChildren() == null
                && (compositeType.getExtensions() == null || compositeType.getExtensions().getXmsEnum() == null);
    }
}
