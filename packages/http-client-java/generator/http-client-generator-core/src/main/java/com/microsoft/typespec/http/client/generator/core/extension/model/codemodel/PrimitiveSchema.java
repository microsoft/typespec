// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Schema types that are primitive language values
 */
public class PrimitiveSchema extends ValueSchema {
    /**
     * Creates a new instance of the PrimitiveSchema class.
     */
    public PrimitiveSchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a PrimitiveSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A PrimitiveSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static PrimitiveSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, PrimitiveSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
