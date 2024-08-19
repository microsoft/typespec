// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.HashMap;
import java.util.Map;

/**
 * The location of a parameter within an HTTP request.
 */
public enum RequestParameterLocation {
    /**
     * The parameter is in the request body.
     */
    BODY("body"),

    /**
     * The parameter is in a cookie.
     */
    COOKIE("cookie"),

    /**
     * The parameter is in the request URI.
     */
    URI("uri"),

    /**
     * The parameter is in the request path.
     */
    PATH("path"),

    /**
     * The parameter is in the request header.
     */
    HEADER("header"),

    /**
     * The parameter is not in the request.
     */
    NONE("none"),

    /**
     * The parameter is in the request query.
     */
    QUERY("query");

    private final String value;
    private final static Map<String, RequestParameterLocation> CONSTANTS = new HashMap<>();

    static {
        for (RequestParameterLocation c : values()) {
            CONSTANTS.put(c.value, c);
        }
    }

    RequestParameterLocation(String value) {
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
     * Gets the value of the parameter location.
     *
     * @return The value of the parameter location.
     */
    public String value() {
        return this.value;
    }

    /**
     * Returns the enum constant of this type with the specified value.
     *
     * @param value The value of the constant.
     * @return The enum constant of this type with the specified value.
     * @throws IllegalArgumentException If the specified value does not map to one of the constants in the enum.
     */
    public static RequestParameterLocation fromValue(String value) {
        RequestParameterLocation constant = CONSTANTS.get(value);
        if (constant == null) {
            throw new IllegalArgumentException(value);
        } else {
            return constant;
        }
    }
}
