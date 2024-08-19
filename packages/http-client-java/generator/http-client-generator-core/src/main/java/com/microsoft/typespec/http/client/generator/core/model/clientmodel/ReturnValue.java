// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Set;

/**
 * A return value from a ClientMethod.
 */
public class ReturnValue {
    /**
     * The description of the return value.
     */
    private String description;
    /**
     * The type of the return value.
     */
    private IType type;

    /**
     * Create a new ReturnValue object from the provided properties.
     * @param description The description of the return value.
     * @param type The type of the return value.
     */
    public ReturnValue(String description, IType type) {
        this.description = description;
        this.type = type;
    }

    public final String getDescription() {
        return description;
    }

    public final IType getType() {
        return type;
    }

    /**
     * Add this return value's imports to the provided set of imports.
     * @param imports The set of imports to add to.
     * @param includeImplementationImports Whether to include imports that are only necessary for method implementations.
     */
    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        getType().addImportsTo(imports, includeImplementationImports);
    }
}
