// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a convenience API.
 */
public class ConvenienceApi extends Metadata {
    private List<Request> requests;

    /**
     * Creates a new instance of the ConvenienceApi class.
     */
    public ConvenienceApi() {
        super();
    }

    /**
     * Gets the requests of the convenience API.
     *
     * @return The requests of the convenience API.
     */
    public List<Request> getRequests() {
        return requests;
    }

    /**
     * Sets the requests of the convenience API.
     *
     * @param requests The requests of the convenience API.
     */
    public void setRequests(List<Request> requests) {
        this.requests = requests;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeArrayField("requests", requests, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a ConvenienceApi instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ConvenienceApi instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ConvenienceApi fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ConvenienceApi::new, (convenienceApi, fieldName, reader) -> {
            if (convenienceApi.tryConsumeParentProperties(convenienceApi, fieldName, reader)) {
                return;
            }

            if ("requests".equals(fieldName)) {
                convenienceApi.requests = reader.readArray(Request::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
