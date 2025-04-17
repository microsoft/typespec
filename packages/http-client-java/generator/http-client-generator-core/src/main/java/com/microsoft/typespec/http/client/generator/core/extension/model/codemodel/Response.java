// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a response from a service.
 */
public class Response extends Metadata {
    private Schema schema;
    private Boolean binary;

    /**
     * Creates a new instance of the Response class.
     */
    public Response() {
    }

    /**
     * Gets the schema of the response.
     *
     * @return The schema of the response.
     */
    public Schema getSchema() {
        return schema;
    }

    /**
     * Sets the schema of the response.
     *
     * @param schema The schema of the response.
     */
    public void setSchema(Schema schema) {
        this.schema = schema;
    }

    /**
     * Gets whether the response is binary.
     *
     * @return Whether the response is binary.
     */
    public Boolean getBinary() {
        return binary;
    }

    /**
     * Sets whether the response is binary.
     *
     * @param binary Whether the response is binary.
     */
    public void setBinary(Boolean binary) {
        this.binary = binary;
    }
}
