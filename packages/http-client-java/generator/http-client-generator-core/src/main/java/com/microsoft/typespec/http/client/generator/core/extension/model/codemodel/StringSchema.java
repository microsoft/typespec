// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a string value.
 */
public class StringSchema extends PrimitiveSchema {
    private double maxLength;
    private double minLength;
    private String pattern;

    /**
     * Creates a new instance of the StringSchema class.
     */
    public StringSchema() {
        super();
    }

    /**
     * Gets the maximum length of the string.
     *
     * @return The maximum length of the string.
     */
    public double getMaxLength() {
        return maxLength;
    }

    /**
     * Sets the maximum length of the string.
     *
     * @param maxLength The maximum length of the string.
     */
    public void setMaxLength(double maxLength) {
        this.maxLength = maxLength;
    }

    /**
     * Gets the minimum length of the string.
     *
     * @return The minimum length of the string.
     */
    public double getMinLength() {
        return minLength;
    }

    /**
     * Sets the minimum length of the string.
     *
     * @param minLength The minimum length of the string.
     */
    public void setMinLength(double minLength) {
        this.minLength = minLength;
    }

    /**
     * Gets a regular expression that the string must be validated against.
     *
     * @return A regular expression that the string must be validated against.
     */
    public String getPattern() {
        return pattern;
    }

    /**
     * Sets a regular expression that the string must be validated against.
     *
     * @param pattern A regular expression that the string must be validated against.
     */
    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    @Override
    public String toString() {
        return StringSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[maxLength="
            + maxLength + ",minLength=" + minLength + ",pattern=" + Objects.toString(pattern, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(pattern, maxLength, minLength);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof StringSchema)) {
            return false;
        }

        StringSchema rhs = ((StringSchema) other);
        return maxLength == rhs.maxLength && minLength == rhs.minLength && Objects.equals(pattern, rhs.pattern);
    }
}
