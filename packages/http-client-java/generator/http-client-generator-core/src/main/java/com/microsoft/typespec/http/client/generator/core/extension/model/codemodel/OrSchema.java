// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents an OR relationship between several schemas/
 */
public class OrSchema extends ComplexSchema {
    private List<ObjectSchema> anyOf = new ArrayList<>();

    /**
     * Creates a new instance of the OrSchema class.
     */
    public OrSchema() {
    }

    /**
     * Gets the set of schemas that this schema is composed of. Every schema is optional. (Required)
     *
     * @return The set of schemas that this schema is composed of. Every schema is optional.
     */
    public List<ObjectSchema> getAnyOf() {
        return anyOf;
    }

    /**
     * Sets the set of schemas that this schema is composed of. Every schema is optional. (Required)
     *
     * @param anyOf The set of schemas that this schema is composed of. Every schema is optional.
     */
    public void setAnyOf(List<ObjectSchema> anyOf) {
        this.anyOf = anyOf;
    }

    @Override
    public String toString() {
        return OrSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[anyOf="
            + Objects.toString(anyOf, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(anyOf);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof OrSchema)) {
            return false;
        }

        OrSchema rhs = (OrSchema) other;
        return Objects.equals(anyOf, rhs.anyOf);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("anyOf", anyOf, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes an OrSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An OrSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static OrSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, OrSchema::new, (schema, fieldName, reader) -> {
            if ("anyOf".equals(fieldName)) {
                schema.anyOf = reader.readArray(ObjectSchema::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
