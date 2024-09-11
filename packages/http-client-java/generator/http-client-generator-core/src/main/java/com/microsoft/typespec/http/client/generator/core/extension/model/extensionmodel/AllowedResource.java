// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

import static com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils.readObject;

/**
 * Represents a resource that is allowed to be accessed.
 */
public class AllowedResource implements JsonSerializable<AllowedResource> {
    private List<String> scopes;
    private String type;

    /**
     * Creates a new instance of the AllowedResource class.
     */
    public AllowedResource() {
    }

    /**
     * Gets the scopes that are allowed to access the resource.
     *
     * @return The scopes that are allowed to access the resource.
     */
    public List<String> getScopes() {
        return scopes;
    }

    /**
     * Sets the scopes that are allowed to access the resource.
     *
     * @param scopes The scopes that are allowed to access the resource.
     */
    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    /**
     * Gets the type of the resource.
     *
     * @return The type of the resource.
     */
    public String getType() {
        return type;
    }

    /**
     * Sets the type of the resource.
     *
     * @param type The type of the resource.
     */
    public void setType(String type) {
        this.type = type;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("scopes", scopes, JsonWriter::writeString)
            .writeStringField("type", type)
            .writeEndObject();
    }

    /**
     * Deserializes an AllowedResource instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An AllowedResource instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static AllowedResource fromJson(JsonReader jsonReader) throws IOException {
        return readObject(jsonReader, AllowedResource::new, (allowedResource, fieldName, reader) -> {
            if ("scopes".equals(fieldName)) {
                allowedResource.scopes = reader.readArray(JsonReader::getString);
            } else if ("type".equals(fieldName)) {
                allowedResource.type = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
