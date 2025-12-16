// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * Known array encoding strategies supported by the generator.
 */
public enum ArrayEncoding {
    PIPE_DELIMITED("pipeDelimited", "|"),
    SPACE_DELIMITED("spaceDelimited", " "),
    COMMA_DELIMITED("commaDelimited", ","),
    NEWLINE_DELIMITED("newlineDelimited", "\\n");

    private final String value;
    private final String delimiter;

    ArrayEncoding(String value, String delimiter) {
        this.value = value;
        this.delimiter = delimiter;
    }

    public String value() {
        return this.value;
    }

    public String getDelimiter() {
        return this.delimiter;
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
