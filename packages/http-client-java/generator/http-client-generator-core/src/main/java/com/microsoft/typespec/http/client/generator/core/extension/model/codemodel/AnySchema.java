// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * A schema that is non-object, non-complex.
 */
public class AnySchema extends Schema {
    /**
     * Creates a new instance of the AnySchema class.
     */
    public AnySchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes an AnySchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An AnySchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static AnySchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, AnySchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
