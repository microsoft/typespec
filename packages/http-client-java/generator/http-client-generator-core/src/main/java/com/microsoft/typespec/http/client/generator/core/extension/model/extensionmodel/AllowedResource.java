// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import java.util.List;

/**
 * Represents a resource that is allowed to be accessed.
 */
public class AllowedResource {
    private List<String> scopes;
    private String type;

    /**
     * Creates a new instance of the AllowedResource class.
     */
    public AllowedResource() {
    }

    /**
     * Gets the scopes that are allowed to access the resource.
     *
     * @return The scopes that are allowed to access the resource.
     */
    public List<String> getScopes() {
        return scopes;
    }

    /**
     * Sets the scopes that are allowed to access the resource.
     *
     * @param scopes The scopes that are allowed to access the resource.
     */
    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    /**
     * Gets the type of the resource.
     *
     * @return The type of the resource.
     */
    public String getType() {
        return type;
    }

    /**
     * Sets the type of the resource.
     *
     * @param type The type of the resource.
     */
    public void setType(String type) {
        this.type = type;
    }
}
