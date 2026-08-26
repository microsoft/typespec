// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a date-time value.
 */
public class DateTimeSchema extends PrimitiveSchema {
    private DateTimeSchema.Format format;

    /**
     * Creates a new instance of the DateTimeSchema class.
     */
    public DateTimeSchema() {
        super();
    }

    /**
     * Gets the date-time format. (Required)
     *
     * @return The date-time format.
     */
    public DateTimeSchema.Format getFormat() {
        return format;
    }

    /**
     * Sets the date-time format. (Required)
     *
     * @param format The date-time format.
     */
    public void setFormat(DateTimeSchema.Format format) {
        this.format = format;
    }

    @Override
    public String toString() {
        return DateTimeSchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this)) + "[format="
            + Objects.toString(format, "<null>") + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(format);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof DateTimeSchema)) {
            return false;
        }

        DateTimeSchema rhs = ((DateTimeSchema) other);
        return format == rhs.format;
    }

    /**
     * The format of the date-time.
     */
    public enum Format {
        /**
         * The date-time format.
         */
        DATE_TIME("date-time"),

        /**
         * The RFC 1123 date-time format.
         */
        DATE_TIME_RFC_1123("date-time-rfc1123");

        private final String value;

        Format(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }

        /**
         * Gets the value of the format.
         *
         * @return The value of the format.
         */
        public String value() {
            return this.value;
        }

        /**
         * Parses a value to a Format instance.
         *
         * @param value The value to parse.
         * @return The parsed Format instance.
         * @throws IllegalArgumentException If the value does not match a known Format.
         */
        public static DateTimeSchema.Format fromValue(String value) {
            if ("date-time".equals(value)) {
                return DATE_TIME;
            } else if ("date-time-rfc1123".equals(value)) {
                return DATE_TIME_RFC_1123;
            } else {
                throw new IllegalArgumentException(value);
            }
        }

    }

}
