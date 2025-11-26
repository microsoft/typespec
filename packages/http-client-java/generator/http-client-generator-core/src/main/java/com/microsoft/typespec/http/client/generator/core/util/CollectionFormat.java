// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.util;

/**
 * Defines the collection format for serializing array parameters.
 */
public enum CollectionFormat {
    /**
     * Comma separated values. E.g. foo,bar
     */
    CSV(","),
    /**
     * Space separated values. E.g. foo bar
     */
    SSV(" "),
    /**
     * Tab separated values. E.g. foo\tbar
     */
    TSV("\t"),
    /**
     * Pipe(|) separated values. E.g. foo|bar
     */
    PIPES("|"),
    /**
     * Corresponds to multiple parameter instances instead of multiple values for a single instance. E.g.
     * foo=bar&amp;foo=baz
     */
    MULTI("&");

    /**
     * The delimiter separating the values.
     */
    private final String delimiter;

    /**
     * Creates CollectionFormat enum.
     *
     * @param delimiter the delimiter as a string.
     */
    CollectionFormat(String delimiter) {
        this.delimiter = delimiter;
    }

    /**
     * Gets the delimiter used to join a list of parameters.
     *
     * @return the delimiter of the current collection format.
     */
    public String getDelimiter() {
        return delimiter;
    }
}
