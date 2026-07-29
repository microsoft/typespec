// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a Number value.
 */
public class NumberSchema extends PrimitiveSchema {
    private double precision;
    private double multipleOf;
    private double maximum;
    private boolean exclusiveMaximum;
    private double minimum;
    private boolean exclusiveMinimum;
    private String encode;

    /**
     * Creates a new instance of the NumberSchema class.
     */
    public NumberSchema() {
    }

    /**
     * The precision of the number. (Required)
     *
     * @return The precision of the number.
     */
    public double getPrecision() {
        return precision;
    }

    /**
     * Sets the precision of the number. (Required)
     *
     * @param precision The precision of the number.
     */
    public void setPrecision(double precision) {
        this.precision = precision;
    }

    /**
     * Gets the multiple of this number must be, if set.
     *
     * @return The multiple of this number must be, if set.
     */
    public double getMultipleOf() {
        return multipleOf;
    }

    /**
     * Sets the multiple of this number must be, if set.
     *
     * @param multipleOf The multiple of this number must be, if set.
     */
    public void setMultipleOf(double multipleOf) {
        this.multipleOf = multipleOf;
    }

    /**
     * Gets the maximum value, if set.
     *
     * @return The maximum value, if set.
     */
    public double getMaximum() {
        return maximum;
    }

    /**
     * Sets the maximum value, if set.
     *
     * @param maximum The maximum value, if set.
     */
    public void setMaximum(double maximum) {
        this.maximum = maximum;
    }

    /**
     * Gets whether the maximum value is exclusive.
     *
     * @return Whether the maximum value is exclusive.
     */
    public boolean isExclusiveMaximum() {
        return exclusiveMaximum;
    }

    /**
     * Sets whether the maximum value is exclusive.
     *
     * @param exclusiveMaximum Whether the maximum value is exclusive.
     */
    public void setExclusiveMaximum(boolean exclusiveMaximum) {
        this.exclusiveMaximum = exclusiveMaximum;
    }

    /**
     * Gets the minimum value, if set.
     *
     * @return The minimum value, if set.
     */
    public double getMinimum() {
        return minimum;
    }

    /**
     * Sets the minimum value, if set.
     *
     * @param minimum The minimum value, if set.
     */
    public void setMinimum(double minimum) {
        this.minimum = minimum;
    }

    /**
     * Gets whether the minimum value is exclusive.
     *
     * @return Whether the minimum value is exclusive.
     */
    public boolean isExclusiveMinimum() {
        return exclusiveMinimum;
    }

    /**
     * Sets whether the minimum value is exclusive.
     *
     * @param exclusiveMinimum Whether the minimum value is exclusive.
     */
    public void setExclusiveMinimum(boolean exclusiveMinimum) {
        this.exclusiveMinimum = exclusiveMinimum;
    }

    /**
     * Gets the encode for the number.
     *
     * @return the encode for the number.
     */
    public String getEncode() {
        return encode;
    }

    /**
     * Sets the encode for the number. Currently only "string" is supported.
     *
     * @param encode the encode for the number.
     */
    public void setEncode(String encode) {
        this.encode = encode;
    }
}
