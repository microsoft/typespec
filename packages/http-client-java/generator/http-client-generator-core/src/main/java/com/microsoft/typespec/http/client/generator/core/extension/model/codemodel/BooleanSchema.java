// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import java.io.IOException;

/**
 * Represents a boolean schema.
 */
public class BooleanSchema extends PrimitiveSchema {

    /**
     * Creates a new instance of the BooleanSchema class.
     */
    public BooleanSchema() {
        super();
    }

    @Override
    public String toString() {
        return BooleanSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof BooleanSchema;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a BooleanSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A BooleanSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static BooleanSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, BooleanSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
