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
 * An AND relationship between several schemas.
 */
public class AndSchema extends ComplexSchema {
    private List<ComplexSchema> allOf = new ArrayList<>();
    private String discriminatorValue;

    /**
     * Creates a new instance of the AndSchema class.
     */
    public AndSchema() {
        super();
    }

    /**
     * Gets the schemas that this schema composes. (Required)
     *
     * @return The schemas that this schema composes.
     */
    public List<ComplexSchema> getAllOf() {
        return allOf;
    }

    /**
     * Sets the schemas that this schema composes. (Required)
     *
     * @param allOf The schemas that this schema composes.
     */
    public void setAllOf(List<ComplexSchema> allOf) {
        this.allOf = allOf;
    }

    /**
     * Gets the value of the discriminator for this schema.
     *
     * @return The value of the discriminator for this schema.
     */
    public String getDiscriminatorValue() {
        return discriminatorValue;
    }

    /**
     * Sets the value of the discriminator for this schema.
     *
     * @param discriminatorValue The value of the discriminator for this schema.
     */
    public void setDiscriminatorValue(String discriminatorValue) {
        this.discriminatorValue = discriminatorValue;
    }

    @Override
    public String toString() {
        return AndSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[allOf="
            + Objects.toString(allOf, "<null>") + ",discriminatorValue="
            + Objects.toString(discriminatorValue, "<null>") + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(allOf, discriminatorValue);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof AndSchema)) {
            return false;
        }
        AndSchema rhs = ((AndSchema) other);
        return Objects.equals(allOf, rhs.allOf) && Objects.equals(discriminatorValue, rhs.discriminatorValue);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeArrayField("allOf", allOf, JsonWriter::writeJson)
            .writeStringField("discriminatorValue", discriminatorValue)
            .writeEndObject();
    }

    /**
     * Deserializes an AndSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An AndSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static AndSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, AndSchema::new, (schema, fieldName, reader) -> {
            if (schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                return;
            }

            if ("allOf".equals(fieldName)) {
                schema.allOf = reader.readArray(ComplexSchema::fromJson);
            } else if ("discriminatorValue".equals(fieldName)) {
                schema.discriminatorValue = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
