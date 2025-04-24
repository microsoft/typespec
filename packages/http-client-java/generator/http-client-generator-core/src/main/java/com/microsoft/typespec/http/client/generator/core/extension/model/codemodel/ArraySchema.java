// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents an array schema.
 */
public class ArraySchema extends ValueSchema {
    private Schema elementType;
    private double maxItems;
    private double minItems;
    private boolean uniqueItems;

    /**
     * Creates a new instance of the ArraySchema class.
     */
    public ArraySchema() {
        super();
    }

    /**
     * Gets the type of elements in the array. (Required)
     *
     * @return The type of elements in the array.
     */
    public Schema getElementType() {
        return elementType;
    }

    /**
     * Sets the type of elements in the array. (Required)
     *
     * @param elementType The type of elements in the array.
     */
    public void setElementType(Schema elementType) {
        this.elementType = elementType;
    }

    /**
     * Gets the maximum number of elements in the array.
     *
     * @return The maximum number of elements in the array.
     */
    public double getMaxItems() {
        return maxItems;
    }

    /**
     * Sets the maximum number of elements in the array.
     *
     * @param maxItems The maximum number of elements in the array.
     */
    public void setMaxItems(double maxItems) {
        this.maxItems = maxItems;
    }

    /**
     * Gets the minimum number of elements in the array.
     *
     * @return The minimum number of elements in the array.
     */
    public double getMinItems() {
        return minItems;
    }

    /**
     * Sets the minimum number of elements in the array.
     *
     * @param minItems The minimum number of elements in the array.
     */
    public void setMinItems(double minItems) {
        this.minItems = minItems;
    }

    /**
     * Gets whether the elements in the array should be unique.
     *
     * @return Whether the elements in the array should be unique.
     */
    public boolean isUniqueItems() {
        return uniqueItems;
    }

    /**
     * Sets whether the elements in the array should be unique.
     *
     * @param uniqueItems Whether the elements in the array should be unique.
     */
    public void setUniqueItems(boolean uniqueItems) {
        this.uniqueItems = uniqueItems;
    }

    @Override
    public String toString() {
        return ArraySchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this)) + "[elementType="
            + Objects.toString(elementType, "<null>") + ",maxItems=" + maxItems + ",minItems=" + minItems
            + ",uniqueItems=" + uniqueItems + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(elementType, maxItems, minItems, uniqueItems);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ArraySchema)) {
            return false;
        }

        ArraySchema rhs = ((ArraySchema) other);
        return minItems == rhs.minItems
            && maxItems == rhs.maxItems
            && uniqueItems == rhs.uniqueItems
            && Objects.equals(this.elementType, rhs.elementType);
    }
}
