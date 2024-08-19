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

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return writeParentProperties(jsonWriter.writeStartObject()).writeEndObject();
    }

    JsonWriter writeParentProperties(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter)
            .writeJsonField("schema", schema)
            .writeBooleanField("binary", binary);
    }

    /**
     * Deserializes a Response instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Response instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Response fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Response::new, (response, fieldName, reader) -> {
            if (!response.tryConsumeParentProperties(response, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }

    boolean tryConsumeParentProperties(Response response, String fieldName, JsonReader reader) throws IOException {
        if (super.tryConsumeParentProperties(response, fieldName, reader)) {
            return true;
        } else if ("schema".equals(fieldName)) {
            response.schema = Schema.fromJson(reader);
            return true;
        } else if ("binary".equals(fieldName)) {
            response.binary = reader.getNullable(JsonReader::getBoolean);
            return true;
        }

        return false;
    }
}
