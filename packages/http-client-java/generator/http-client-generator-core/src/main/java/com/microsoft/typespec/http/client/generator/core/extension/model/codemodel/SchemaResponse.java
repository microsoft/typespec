// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

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

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeJsonField("schema", schema)
            .writeEndObject();
    }

    /**
     * Deserializes a SchemaResponse instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A SchemaResponse instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static SchemaResponse fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, SchemaResponse::new, (response, fieldName, reader) -> {
            if (response.tryConsumeParentProperties(response, fieldName, reader)) {
                return;
            }

            if ("schema".equals(fieldName)) {
                response.schema = Schema.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
