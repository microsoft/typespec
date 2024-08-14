// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents an ODataQuery value.
 */
public class ODataQuerySchema extends Schema {

    /**
     * Creates a new instance of the ODataQuerySchema class.
     */
    public ODataQuerySchema() {
    }

    @Override
    public String toString() {
        return ODataQuerySchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
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

        return other instanceof ODataQuerySchema;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes an ODataQuerySchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An ODataQuerySchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ODataQuerySchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ODataQuerySchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
