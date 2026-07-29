// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents the C# language.
 */
public class CSharpLanguage {

    /**
     * Creates a new instance of the CSharpLanguage class.
     */
    public CSharpLanguage() {
    }

    @Override
    public String toString() {
        return CSharpLanguage.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof CSharpLanguage;
    }
}
