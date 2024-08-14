// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

import static com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils.readObject;

/**
 * Represents the options for a long-running operation.
 */
public class XmsLongRunningOperationOptions implements JsonSerializable<XmsLongRunningOperationOptions> {
    // azure-async-operation
    // location
    // original-uri
    private String finalStateVia;

    /**
     * Creates a new instance of the XmsLongRunningOperationOptions class.
     */
    public XmsLongRunningOperationOptions() {
    }

    /**
     * Gets the final state via.
     *
     * @return The final state via.
     */
    public String getFinalStateVia() {
        return finalStateVia;
    }

    /**
     * Sets the final state via.
     *
     * @param finalStateVia The final state via.
     */
    public void setFinalStateVia(String finalStateVia) {
        this.finalStateVia = finalStateVia;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("finalStateVia", finalStateVia)
            .writeEndObject();
    }

    /**
     * Deserializes an XmsLongRunningOperationOptions instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An XmsLongRunningOperationOptions instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XmsLongRunningOperationOptions fromJson(JsonReader jsonReader) throws IOException {
        return readObject(jsonReader, XmsLongRunningOperationOptions::new, (lroOptions, fieldName, reader) -> {
            if ("finalStateVia".equals(fieldName)) {
                lroOptions.finalStateVia = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
