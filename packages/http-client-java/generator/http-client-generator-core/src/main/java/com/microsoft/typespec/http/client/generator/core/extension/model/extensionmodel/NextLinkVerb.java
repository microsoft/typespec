// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

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
        if (GET.value.equals(value)) {
            return GET;
        } else if (POST.value.equals(value)) {
            return POST;
        }
        throw new IllegalArgumentException(value);
    }
}
