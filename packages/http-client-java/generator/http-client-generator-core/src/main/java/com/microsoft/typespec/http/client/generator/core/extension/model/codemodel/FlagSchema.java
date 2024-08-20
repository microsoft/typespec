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
 * Represents a flag schema.
 */
public class FlagSchema extends ValueSchema {
    private List<FlagValue> choices = new ArrayList<>();

    /**
     * Creates a new instance of the FlagSchema class.
     */
    public FlagSchema() {
        super();
    }

    /**
     * Get the possible choices in the set. (Required)
     *
     * @return The possible choices in the set.
     */
    public List<FlagValue> getChoices() {
        return choices;
    }

    /**
     * Set the possible choices in the set. (Required)
     *
     * @param choices The possible choices in the set.
     */
    public void setChoices(List<FlagValue> choices) {
        this.choices = choices;
    }

    @Override
    public String toString() {
        return FlagSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[choices="
            + choices + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(choices);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof FlagSchema)) {
            return false;
        }

        FlagSchema rhs = ((FlagSchema) other);
        return Objects.equals(choices, rhs.choices);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("choices", choices, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a FlagSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A FlagSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static FlagSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, FlagSchema::new, (schema, fieldName, reader) -> {
            if ("choices".equals(fieldName)) {
                schema.choices = reader.readArray(FlagValue::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
