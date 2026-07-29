// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a NOT relationship between schemas.
 */
public class NotSchema extends Schema {
    private Schema not;

    /**
     * Creates a new instance of the NotSchema class.
     */
    public NotSchema() {
    }

    /**
     * Gets the schema that this may not be. (Required)
     *
     * @return The schema that this may not be.
     */
    public Schema getNot() {
        return not;
    }

    /**
     * Sets the schema that this may not be. (Required)
     *
     * @param not The schema that this may not be.
     */
    public void setNot(Schema not) {
        this.not = not;
    }
}
