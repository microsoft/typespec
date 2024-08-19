// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Map;

import static com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils.readObject;

/**
 * Represents the examples of a model.
 */
public class XmsExamples implements JsonSerializable<XmsExamples> {
    private Map<String, Object> examples;

    /**
     * Creates a new instance of the XmsExamples class.
     */
    public XmsExamples() {
    }

    /**
     * Gets the examples of the model.
     *
     * @return The examples of the model.
     */
    public Map<String, Object> getExamples() {
        return examples;
    }

    /**
     * Sets the examples of the model.
     *
     * @param examples The examples of the model.
     */
    public void setExamples(Map<String, Object> examples) {
        this.examples = examples;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeMapField("examples", examples, JsonWriter::writeUntyped)
            .writeEndObject();
    }

    /**
     * Deserializes an XmsExamples instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An XmsExamples instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XmsExamples fromJson(JsonReader jsonReader) throws IOException {
        return readObject(jsonReader, XmsExamples::new, (xmsExamples, fieldName, reader) -> {
            if ("examples".equals(fieldName)) {
                xmsExamples.examples = reader.readMap(JsonReader::readUntyped);
            } else {
                reader.skipChildren();
            }
        });
    }
}
