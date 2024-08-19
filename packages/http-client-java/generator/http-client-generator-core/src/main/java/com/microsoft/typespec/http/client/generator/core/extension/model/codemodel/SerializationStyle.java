// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents individual serialization styles.
 */
public enum SerializationStyle {
    /**
     * The serialization style is binary.
     */
    BINARY("binary"),

    /**
     * The serialization style is deep object.
     */
    DEEP_OBJECT("deepObject"),

    /**
     * The serialization style is form.
     */
    FORM("form"),

    /**
     * The serialization style is JSON.
     */
    JSON("json"),

    /**
     * The serialization style is label.
     */
    LABEL("label"),

    /**
     * The serialization style is matrix.
     */
    MATRIX("matrix"),

    /**
     * The serialization style is pipe delimited.
     */
    PIPE_DELIMITED("pipeDelimited"),

    /**
     * The serialization style is simple.
     */
    SIMPLE("simple"),

    /**
     * The serialization style is space delimited.
     */
    SPACE_DELIMITED("spaceDelimited"),

    /**
     * The serialization style is tab delimited.
     */
    TAB_DELIMITED("tabDelimited"),

    /**
     * The serialization style is XML.
     */
    XML("xml");

    private final String value;
    private final static Map<String, SerializationStyle> CONSTANTS = new HashMap<>();

    static {
        for (SerializationStyle c : values()) {
            CONSTANTS.put(c.value, c);
        }
    }

    SerializationStyle(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        if ("uri".equals(this.value)) {
            return "host";
        } else {
            return this.value;
        }
    }

    /**
     * Gets the value of the serialization style.
     *
     * @return The value of the serialization style.
     */
    public String value() {
        return this.value;
    }

    /**
     * Gets the serialization style from its value.
     *
     * @param value The value of the serialization style.
     * @return The serialization style.
     * @throws IllegalArgumentException If the value is not a valid serialization style.
     */
    public static SerializationStyle fromValue(String value) {
        SerializationStyle constant = CONSTANTS.get(value);
        if (constant == null) {
            throw new IllegalArgumentException(value);
        } else {
            return constant;
        }
    }
}
