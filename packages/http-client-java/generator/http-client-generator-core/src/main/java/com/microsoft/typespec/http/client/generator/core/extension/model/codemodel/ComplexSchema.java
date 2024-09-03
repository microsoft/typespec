// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a complex schema (types that can be an object).
 */
public class ComplexSchema extends Schema {
    /**
     * Creates a new instance of the ComplexSchema class.
     */
    public ComplexSchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a ComplexSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ComplexSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ComplexSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ComplexSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
