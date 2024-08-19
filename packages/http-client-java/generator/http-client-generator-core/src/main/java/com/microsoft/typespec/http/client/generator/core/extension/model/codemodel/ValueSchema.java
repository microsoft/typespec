// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Schema types that are non-object or complex types.
 */
public class ValueSchema extends Schema {
    /**
     * Creates a new instance of the ValueSchema class.
     */
    public ValueSchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a ValueSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ValueSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ValueSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ValueSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
