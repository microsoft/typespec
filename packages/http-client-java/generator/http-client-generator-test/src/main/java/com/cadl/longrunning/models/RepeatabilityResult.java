// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.longrunning.models;

/**
 * Repeatability Result header options.
 */
public enum RepeatabilityResult {
    /**
     * If the request was accepted and the server guarantees that the server state reflects a single execution of the
     * operation.
     */
    ACCEPTED("accepted"),

    /**
     * If the request was rejected because the combination of Repeatability-First-Sent and Repeatability-Request-ID were
     * invalid
     * or because the Repeatability-First-Sent value was outside the range of values held by the server.
     */
    REJECTED("rejected");

    /**
     * The actual serialized value for a RepeatabilityResult instance.
     */
    private final String value;

    RepeatabilityResult(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a RepeatabilityResult instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed RepeatabilityResult object, or null if unable to parse.
     */
    public static RepeatabilityResult fromString(String value) {
        if (value == null) {
            return null;
        }
        RepeatabilityResult[] items = RepeatabilityResult.values();
        for (RepeatabilityResult item : items) {
            if (item.toString().equalsIgnoreCase(value)) {
                return item;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return this.value;
    }
}
