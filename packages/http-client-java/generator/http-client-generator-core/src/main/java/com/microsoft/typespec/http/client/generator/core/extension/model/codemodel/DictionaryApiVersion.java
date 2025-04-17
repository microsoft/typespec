// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents the version of the dictionary API.
 */
public class DictionaryApiVersion {

    /**
     * Creates a new instance of the DictionaryApiVersion class.
     */
    public DictionaryApiVersion() {
    }

    @Override
    public String toString() {
        return DictionaryApiVersion.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof DictionaryApiVersion;
    }
}
