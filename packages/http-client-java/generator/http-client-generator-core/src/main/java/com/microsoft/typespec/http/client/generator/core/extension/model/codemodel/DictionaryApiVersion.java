// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents the version of the dictionary API.
 */
public class DictionaryApiVersion implements JsonSerializable<DictionaryApiVersion> {

    /**
     * Creates a new instance of the DictionaryApiVersion class.
     */
    public DictionaryApiVersion() {
    }

    @Override
    public String toString() {
        return DictionaryApiVersion.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
    }

    @Override
    public int hashCode() {
        return 1;
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        return other instanceof DictionaryApiVersion;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject().writeEndObject();
    }

    /**
     * Deserializes a DictionaryApiVersion instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A DictionaryApiVersion instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static DictionaryApiVersion fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readEmptyObject(jsonReader, DictionaryApiVersion::new);
    }
}
