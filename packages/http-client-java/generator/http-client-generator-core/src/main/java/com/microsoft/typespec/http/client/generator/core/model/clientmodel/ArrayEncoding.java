// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * Known array encoding strategies supported by the generator.
 */
public enum ArrayEncoding {
    PIPE_DELIMITED("pipeDelimited", "|", "\\\\|"),
    SPACE_DELIMITED("spaceDelimited", " "),
    COMMA_DELIMITED("commaDelimited", ","),
    NEWLINE_DELIMITED("newlineDelimited", "\\n");

    private final String value;
    private final String delimiter;
    private final String escapedDelimiter;

    ArrayEncoding(String value, String delimiter) {
        this.value = value;
        this.delimiter = delimiter;
        this.escapedDelimiter = delimiter;
    }

    ArrayEncoding(String value, String delimiter, String escapedDelimiter) {
        this.value = value;
        this.delimiter = delimiter;
        this.escapedDelimiter = escapedDelimiter;
    }

    public String value() {
        return this.value;
    }

    public String getDelimiter() {
        return this.delimiter;
    }

    public String getEscapedDelimiter() {
        return escapedDelimiter;
    }

    @Override
    public String toString() {
        return this.value();
    }

    public static ArrayEncoding fromValue(String value) {
        if (value == null) {
            return null;
        }

        for (ArrayEncoding v : values()) {
            if (v.value().equalsIgnoreCase(value)) {
                return v;
            }
        }
        return null;
    }
}
