// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a NOT relationship between schemas.
 */
public class NotSchema extends Schema {
    private Schema not;

    /**
     * Creates a new instance of the NotSchema class.
     */
    public NotSchema() {
    }

    /**
     * Gets the schema that this may not be. (Required)
     *
     * @return The schema that this may not be.
     */
    public Schema getNot() {
        return not;
    }

    /**
     * Sets the schema that this may not be. (Required)
     *
     * @param not The schema that this may not be.
     */
    public void setNot(Schema not) {
        this.not = not;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("not", not)
            .writeEndObject();
    }

    /**
     * Deserializes a NotSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A NotSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static NotSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, NotSchema::new, (schema, fieldName, reader) -> {
            if ("not".equals(fieldName)) {
                schema.not = Schema.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
