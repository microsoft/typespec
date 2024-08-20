// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represent a binary schema.
 */
public class BinarySchema extends Schema {
    /**
     * Create a new instance of the BinarySchema class.
     */
    public BinarySchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a BinarySchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A BinarySchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static BinarySchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, BinarySchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
