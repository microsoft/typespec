// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.HashMap;
import java.util.Map;

/**
 * Known media types.
 */
public enum KnownMediaType {
    /**
     * The media type is binary.
     */
    BINARY("binary"),

    /**
     * The media type is a form.
     */
    FORM("form"),

    /**
     * The media type is JSON.
     */
    JSON("json"),

    /**
     * The media type is multipart.
     */
    MULTIPART("multipart"),

    /**
     * The media type is text.
     */
    TEXT("text"),

    /**
     * The media type is unknown.
     */
    UNKNOWN("unknown"),

    /**
     * The media type is XML.
     */
    XML("xml");

    private final String value;
    private final static Map<String, KnownMediaType> CONSTANTS = new HashMap<>();

    static {
        for (KnownMediaType c: values()) {
            CONSTANTS.put(c.value, c);
        }
    }

    KnownMediaType(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return this.value;
    }

    /**
     * Get the string value of the KnownMediaType.
     *
     * @return The string value.
     */
    public String value() {
        return this.value;
    }

    /**
     * Get the KnownMediaType from a string value.
     *
     * @param value The string value.
     * @return The KnownMediaType.
     * @throws IllegalArgumentException If the string value doesn't correspond to a KnownMediaType.
     */
    public static KnownMediaType fromValue(String value) {
        KnownMediaType constant = CONSTANTS.get(value);
        if (constant == null) {
            throw new IllegalArgumentException(value);
        } else {
            return constant;
        }
    }

    /**
     * Get the content type for the KnownMediaType.
     *
     * @return The content type.
     */
    public String getContentType() {
        switch (this) {
            case BINARY: return "application/octet-stream";
            case FORM: return "application/x-www-form-urlencoded";
            case JSON: return "application/json";
            case MULTIPART: return "multipart/form-data";
            case TEXT: return "text/plain";
            case XML: return "application/xml";
            default: return JSON.getContentType();
        }
    }
}
