// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a response from a service.
 */
public class SchemaResponse extends Response {
    private Schema schema;

    /**
     * Creates a new instance of the SchemaResponse class.
     */
    public SchemaResponse() {
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
}
