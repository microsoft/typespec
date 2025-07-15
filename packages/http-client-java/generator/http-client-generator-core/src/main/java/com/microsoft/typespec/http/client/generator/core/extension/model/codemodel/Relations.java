// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;

/**
 * Represents relations between schemas.
 */
public class Relations {
    private List<Schema> all;
    private List<Schema> immediate;

    /**
     * Creates a new instance of the Relations class.
     */
    public Relations() {
    }

    /**
     * Gets all schemas.
     *
     * @return The all schemas.
     */
    public List<Schema> getAll() {
        return all;
    }

    /**
     * Sets all schemas.
     *
     * @param all The all schemas.
     */
    public void setAll(List<Schema> all) {
        this.all = all;
    }

    /**
     * Gets immediate schemas.
     *
     * @return The immediate schemas.
     */
    public List<Schema> getImmediate() {
        return immediate;
    }

    /**
     * Sets immediate schemas.
     *
     * @param immediate The immediate schemas.
     */
    public void setImmediate(List<Schema> immediate) {
        this.immediate = immediate;
    }
}
