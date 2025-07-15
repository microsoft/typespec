// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a byte array schema.
 */
public class ByteArraySchema extends PrimitiveSchema {
    private ByteArraySchema.Format format;

    /**
     * Creates a new instance of the ByteArraySchema class.
     */
    public ByteArraySchema() {
        super();
    }

    /**
     * Gets the byte array format. (Required)
     *
     * @return The byte array format.
     */
    public ByteArraySchema.Format getFormat() {
        return format;
    }

    /**
     * Sets the byte array format. (Required)
     *
     * @param format The byte array format.
     */
    public void setFormat(ByteArraySchema.Format format) {
        this.format = format;
    }

    @Override
    public String toString() {
        return ByteArraySchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[format="
            + Objects.toString(format, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(format);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ByteArraySchema)) {
            return false;
        }

        ByteArraySchema rhs = ((ByteArraySchema) other);
        return Objects.equals(format, rhs.format);
    }

    /**
     * Represents the format of the byte array.
     */
    public enum Format {
        /**
         * The byte array is encoded as a base64url string.
         */
        BASE_64_URL("base64url"),

        /**
         * The byte array is encoded as a byte string.
         */
        BYTE("byte");

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
         * Parses a string to a ByteArraySchema.Format.
         *
         * @param value The value to parse.
         * @return The parsed ByteArraySchema.Format.
         * @throws IllegalArgumentException If the value does not match a known ByteArraySchema.Format.
         */
        public static ByteArraySchema.Format fromValue(String value) {
            if ("base64url".equals(value)) {
                return BASE_64_URL;
            } else if ("byte".equals(value)) {
                return BYTE;
            } else {
                throw new IllegalArgumentException(value);
            }
        }

    }

}
