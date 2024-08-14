// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public enum ParameterSynthesizedOrigin {

    /**
     * host url parameter
     */
    HOST("modelerfour:synthesized/host"),

    /**
     * accept header
     */
    ACCEPT("modelerfour:synthesized/accept"),

    /**
     * content-type header
     */
    CONTENT_TYPE("modelerfour:synthesized/content-type"),

    /**
     * api-version (usually) query parameter
     */
    API_VERSION("modelerfour:synthesized/api-version"),

    /**
     * Context
     */
    CONTEXT("java:synthesized/Context"),

    /**
     * RequestOptions
     */
    REQUEST_OPTIONS("java:synthesized/RequestOptions"),

    /**
     * The parameter is not synthesized.
     */
    NONE("none");   // NONE is not defined as m4 output


    private final String origin;

    ParameterSynthesizedOrigin(String origin) {
        this.origin = origin;
    }

    public String value() {
        return this.origin;
    }

    @Override
    public String toString() {
        return this.value();
    }

    public static ParameterSynthesizedOrigin fromValue(String value) {
        if (value == null) {
            return NONE;
        }

        for (ParameterSynthesizedOrigin v : values()) {
            if (v.value().equalsIgnoreCase(value)) {
                return v;
            }
        }
        return NONE;
    }
}
