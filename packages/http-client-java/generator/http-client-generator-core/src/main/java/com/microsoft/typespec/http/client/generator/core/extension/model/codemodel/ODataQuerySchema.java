// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents an ODataQuery value.
 */
public class ODataQuerySchema extends Schema {

    /**
     * Creates a new instance of the ODataQuerySchema class.
     */
    public ODataQuerySchema() {
    }

    @Override
    public String toString() {
        return ODataQuerySchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof ODataQuerySchema;
    }
}
