// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents relations between schemas.
 */
public class Relations implements JsonSerializable<Relations> {
    private List<Schema> all;
    private List<Schema> immediate;

    /**
     * Creates a new instance of the Relations class.
     */
    public Relations() {
    }

    /**
     * Gets all schemas.
     *
     * @return The all schemas.
     */
    public List<Schema> getAll() {
        return all;
    }

    /**
     * Sets all schemas.
     *
     * @param all The all schemas.
     */
    public void setAll(List<Schema> all) {
        this.all = all;
    }

    /**
     * Gets immediate schemas.
     *
     * @return The immediate schemas.
     */
    public List<Schema> getImmediate() {
        return immediate;
    }

    /**
     * Sets immediate schemas.
     *
     * @param immediate The immediate schemas.
     */
    public void setImmediate(List<Schema> immediate) {
        this.immediate = immediate;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("all", all, JsonWriter::writeJson)
            .writeArrayField("immediate", immediate, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Relations instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Relations instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Relations fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Relations::new, (relations, fieldName, reader) -> {
            if ("all".equals(fieldName)) {
                relations.all = reader.readArray(Schema::fromJson);
            } else if ("immediate".equals(fieldName)) {
                relations.immediate = reader.readArray(Schema::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
