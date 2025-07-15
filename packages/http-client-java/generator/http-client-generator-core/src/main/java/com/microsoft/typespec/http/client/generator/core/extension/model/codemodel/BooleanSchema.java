// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a boolean schema.
 */
public class BooleanSchema extends PrimitiveSchema {

    /**
     * Creates a new instance of the BooleanSchema class.
     */
    public BooleanSchema() {
        super();
    }

    @Override
    public String toString() {
        return BooleanSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
    }

    @Override
    public int hashCode() {
        return 1;
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        return other instanceof BooleanSchema;
    }
}
