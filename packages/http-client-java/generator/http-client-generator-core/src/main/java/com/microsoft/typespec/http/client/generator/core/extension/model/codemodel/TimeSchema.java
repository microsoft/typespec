// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a time schema.
 */
public class TimeSchema extends PrimitiveSchema {
    /**
     * Creates a new instance of the TimeSchema class.
     */
    public TimeSchema() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a TimeSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A TimeSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static TimeSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, TimeSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
