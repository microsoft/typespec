// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a Uuid value.
 */
public class UuidSchema extends PrimitiveSchema {

    /**
     * Creates a new instance of the UuidSchema class.
     */
    public UuidSchema() {
        super();
    }

    @Override
    public String toString() {
        return UuidSchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof UuidSchema;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a UuidSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A UuidSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static UuidSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, UuidSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
