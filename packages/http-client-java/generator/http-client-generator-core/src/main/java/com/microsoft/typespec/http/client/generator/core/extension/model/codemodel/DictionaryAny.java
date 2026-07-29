// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a dictionary of any type.
 */
public class DictionaryAny {

    /**
     * Creates a new instance of the DictionaryAny class.
     */
    public DictionaryAny() {
    }

    @Override
    public String toString() {
        return DictionaryAny.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof DictionaryAny;
    }
}
