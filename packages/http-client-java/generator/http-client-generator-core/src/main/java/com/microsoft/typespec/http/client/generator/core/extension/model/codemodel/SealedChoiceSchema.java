// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a choice of several values (ie, an 'enum').
 */
public class SealedChoiceSchema extends ChoiceSchema {

    /**
     * Creates a new instance of the SealedChoiceSchema class.
     */
    public SealedChoiceSchema() {
        super();
    }

    @Override
    public String toString() {
        return sharedToString(this, SealedChoiceSchema.class.getName());
    }

    @Override
    public int hashCode() {
        return sharedHashCode(this);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }
        if (!(other instanceof SealedChoiceSchema)) {
            return false;
        }

        return sharedEquals(this, (SealedChoiceSchema) other);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a SealedChoiceSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A SealedChoiceSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static SealedChoiceSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, SealedChoiceSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
