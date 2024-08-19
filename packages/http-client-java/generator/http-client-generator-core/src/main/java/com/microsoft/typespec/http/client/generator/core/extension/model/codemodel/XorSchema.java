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
 * Represents an XOR relationship between several schemas
 */
public class XorSchema extends ComplexSchema {
    private List<Schema> oneOf = new ArrayList<>();

    /**
     * Creates a new instance of the XorSchema class.
     */
    public XorSchema() {
        super();
    }

    /**
     * Gets the set of schemas that this must be one and only one of. (Required)
     *
     * @return The set of schemas that this must be one and only one of.
     */
    public List<Schema> getOneOf() {
        return oneOf;
    }

    /**
     * Sets the set of schemas that this must be one and only one of. (Required)
     *
     * @param oneOf The set of schemas that this must be one and only one of.
     */
    public void setOneOf(List<Schema> oneOf) {
        this.oneOf = oneOf;
    }

    @Override
    public String toString() {
        return XorSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[oneOf="
            + Objects.toString(oneOf, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(oneOf);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof XorSchema)) {
            return false;
        }

        XorSchema rhs = ((XorSchema) other);
        return Objects.equals(oneOf, rhs.oneOf);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeArrayField("oneOf", oneOf, JsonWriter::writeJson)
            .writeEndObject();
    }
    /**
     * Deserializes a XorSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A XorSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XorSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, XorSchema::new, (schema, fieldName, reader) -> {
            if (schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                return;
            }

            if ("oneOf".equals(fieldName)) {
                schema.oneOf = reader.readArray(Schema::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
