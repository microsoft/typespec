// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model;

import java.util.List;

/**
 * Represents a smart location.
 */
public class SmartLocation {
    private List<Object> path;

    /**
     * Creates a new instance of the SmartLocation class.
     */
    public SmartLocation() {
    }

    /**
     * Gets the path of the location.
     *
     * @return The path of the location.
     */
    public List<Object> getPath() {
        return path;
    }

    /**
     * Sets the path of the location.
     *
     * @param path The path of the location.
     */
    public void setPath(List<Object> path) {
        this.path = path;
    }
}
