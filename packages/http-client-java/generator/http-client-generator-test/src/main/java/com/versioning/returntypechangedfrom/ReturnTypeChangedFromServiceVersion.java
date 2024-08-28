// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.versioning.returntypechangedfrom;

import com.azure.core.util.ServiceVersion;

/**
 * Service version of ReturnTypeChangedFromClient.
 */
public enum ReturnTypeChangedFromServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    ReturnTypeChangedFromServiceVersion(String version) {
        this.version = version;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getVersion() {
        return this.version;
    }

    /**
     * Gets the latest service version supported by this client library.
     * 
     * @return The latest {@link ReturnTypeChangedFromServiceVersion}.
     */
    public static ReturnTypeChangedFromServiceVersion getLatest() {
        return V2;
    }
}
