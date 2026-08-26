// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a key-value collection.
 */
public class DictionarySchema extends ComplexSchema {
    private Schema elementType;
    private Boolean nullableItems;

    /**
     * Creates a new instance of the DictionarySchema class.
     */
    public DictionarySchema() {
        super();
    }

    /**
     * Gets the type of the elements in the dictionary. (Required)
     *
     * @return The type of the elements in the dictionary.
     */
    public Schema getElementType() {
        return elementType;
    }

    /**
     * Sets the type of the elements in the dictionary. (Required)
     *
     * @param elementType The type of the elements in the dictionary.
     */
    public void setElementType(Schema elementType) {
        this.elementType = elementType;
    }

    /**
     * Gets whether the items in the dictionary can be null.
     *
     * @return Whether the items in the dictionary can be null.
     */
    public Boolean getNullableItems() {
        return nullableItems;
    }

    /**
     * Sets whether the items in the dictionary can be null.
     *
     * @param nullableItems Whether the items in the dictionary can be null.
     */
    public void setNullableItems(Boolean nullableItems) {
        this.nullableItems = nullableItems;
    }

    @Override
    public String toString() {
        return DictionarySchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this))
            + "[elementType=" + Objects.toString(elementType, "<null>") + ",nullableItems="
            + Objects.toString(nullableItems, "<null>") + "]";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof DictionarySchema)) {
            return false;
        }

        DictionarySchema that = (DictionarySchema) o;
        return Objects.equals(elementType, that.elementType) && Objects.equals(nullableItems, that.nullableItems);
    }

    @Override
    public int hashCode() {
        return Objects.hash(elementType, nullableItems);
    }
}
