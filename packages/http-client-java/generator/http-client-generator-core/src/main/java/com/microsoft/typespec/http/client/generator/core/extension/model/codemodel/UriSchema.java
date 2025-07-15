// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a Uri value.
 */
public class UriSchema extends PrimitiveSchema {
    private double maxLength;
    private double minLength;
    private String pattern;

    /**
     * Creates a new instance of the UriSchema class.
     */
    public UriSchema() {
        super();
    }

    /**
     * Get the maximum length of the URI.
     *
     * @return The maximum length of the URI.
     */
    public double getMaxLength() {
        return maxLength;
    }

    /**
     * Set the maximum length of the URI.
     *
     * @param maxLength The maximum length of the URI.
     */
    public void setMaxLength(double maxLength) {
        this.maxLength = maxLength;
    }

    /**
     * Get the minimum length of the URI.
     *
     * @return The minimum length of the URI.
     */
    public double getMinLength() {
        return minLength;
    }

    /**
     * Set the minimum length of the URI.
     *
     * @param minLength The minimum length of the URI.
     */
    public void setMinLength(double minLength) {
        this.minLength = minLength;
    }

    /**
     * Get a regular expression that the URI must be validated against.
     *
     * @return A regular expression that the URI must be validated against.
     */
    public String getPattern() {
        return pattern;
    }

    /**
     * Set a regular expression that the URI must be validated against.
     *
     * @param pattern A regular expression that the URI must be validated against.
     */
    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    @Override
    public String toString() {
        return UriSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[maxLength="
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

        if (!(other instanceof UriSchema)) {
            return false;
        }

        UriSchema rhs = ((UriSchema) other);
        return maxLength == rhs.maxLength && minLength == rhs.minLength && Objects.equals(pattern, rhs.pattern);
    }
}
