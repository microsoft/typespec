// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a Duration value.
 */
public class DurationSchema extends PrimitiveSchema {
    private Format format;

    /**
     * Creates a new instance of the DurationSchema class.
     */
    public DurationSchema() {
        super();
    }

    /**
     * Gets the duration format.
     *
     * @return The duration format.
     */
    public Format getFormat() {
        return format;
    }

    /**
     * Sets the duration format.
     *
     * @param format The duration format.
     */
    public void setFormat(Format format) {
        this.format = format;
    }

    @Override
    public String toString() {
        return DurationSchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this)) + "[format="
            + Objects.toString(format, "<null>") + ']';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof DurationSchema)) {
            return false;
        }

        DurationSchema that = (DurationSchema) o;
        return format == that.format;
    }

    @Override
    public int hashCode() {
        return Objects.hash(format);
    }

    /**
     * The format of the duration.
     */
    public enum Format {
        /**
         * The duration is in RFC3339 format.
         */
        DURATION("duration-rfc3339"),

        /**
         * The duration is in seconds as an integer.
         */
        SECONDS_INTEGER("seconds-integer"),

        /**
         * The duration is in seconds as a number.
         */
        SECONDS_NUMBER("seconds-number");

        private final String value;

        Format(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }

        /**
         * Gets the string value of the format.
         *
         * @return The string value of the format.
         */
        public String value() {
            return this.value;
        }

        /**
         * Parses a string value to a Format instance.
         *
         * @param value The string value to parse.
         * @return The parsed Format instance.
         * @throws IllegalArgumentException If the string value does not correspond to a valid Format instance.
         */
        public static Format fromValue(String value) {
            if ("duration-rfc3339".equals(value)) {
                return DURATION;
            } else if ("seconds-integer".equals(value)) {
                return SECONDS_INTEGER;
            } else if ("seconds-number".equals(value)) {
                return SECONDS_NUMBER;
            } else {
                throw new IllegalArgumentException(value);
            }
        }
    }
}
