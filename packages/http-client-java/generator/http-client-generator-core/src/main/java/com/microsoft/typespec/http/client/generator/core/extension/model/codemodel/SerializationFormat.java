// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a serialization format.
 */
public class SerializationFormat {
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the SerializationFormat class.
     */
    public SerializationFormat() {
    }

    /**
     * Gets the extensions.
     *
     * @return The extensions.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions.
     *
     * @param extensions The extensions.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return SerializationFormat.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this))
            + "[extensions=" + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(extensions);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof SerializationFormat)) {
            return false;
        }

        SerializationFormat rhs = ((SerializationFormat) other);
        return Objects.equals(extensions, rhs.extensions);
    }
}
