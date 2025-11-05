// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents the HTTP verb for the nextLink operation in pageable settings.
 */
public enum NextLinkVerb {
    /**
     * The HTTP verb is GET.
     */
    GET("GET"),

    /**
     * The HTTP verb is POST.
     */
    POST("POST");

    private final String value;
    private static final Map<String, NextLinkVerb> CONSTANTS = new HashMap<>();

    static {
        for (NextLinkVerb v : values()) {
            CONSTANTS.put(v.value, v);
        }
    }

    NextLinkVerb(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return this.value;
    }

    /**
     * Gets the value of the HTTP verb.
     *
     * @return The value of the HTTP verb.
     */
    public String value() {
        return this.value;
    }

    /**
     * Gets the NextLinkVerb from its value.
     *
     * @param value The value of the HTTP verb.
     * @return The NextLinkVerb.
     * @throws IllegalArgumentException If the value is not a valid HTTP verb.
     */
    public static NextLinkVerb fromValue(String value) {
        NextLinkVerb constant = CONSTANTS.get(value);
        if (constant == null) {
            throw new IllegalArgumentException(value);
        } else {
            return constant;
        }
    }
}
