// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a smart location.
 */
public class SmartLocation implements JsonSerializable<SourceLocation> {
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

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("path", path, JsonWriter::writeUntyped)
            .writeEndObject();
    }

    /**
     * Deserializes a SmartLocation instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A SmartLocation instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static SmartLocation fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            SmartLocation smartLocation = new SmartLocation();

            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("path".equals(fieldName)) {
                    smartLocation.path = reader.readArray(JsonReader::readUntyped);
                } else {
                    reader.skipChildren();;
                }
            }

            return smartLocation;
        });
    }
}
