// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model;

/**
 * Represents a source location.
 */
public class SourceLocation {
    private String document;
    private SmartLocation position;

    /**
     * Creates a new instance of the SourceLocation class.
     */
    public SourceLocation() {
    }

    /**
     * Gets the position of the location.
     *
     * @return The position of the location.
     */
    public SmartLocation getPosition() {
        return position;
    }

    /**
     * Gets the document of the location.
     *
     * @return The document of the location.
     */
    public String getDocument() {
        return document;
    }

    /**
     * Sets the document of the location.
     *
     * @param document The document of the location.
     */
    public void setDocument(String document) {
        this.document = document;
    }

    /**
     * Sets the position of the location.
     *
     * @param position The position of the location.
     */
    public void setPosition(SmartLocation position) {
        this.position = position;
    }
}
