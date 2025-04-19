// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.flatten.implementation.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The SendOptionalBodyRequest model.
 */
@Fluent
public final class SendOptionalBodyRequest implements JsonSerializable<SendOptionalBodyRequest> {
    /*
     * The name property.
     */
    @Generated
    private String name;

    /**
     * Creates an instance of SendOptionalBodyRequest class.
     */
    @Generated
    public SendOptionalBodyRequest() {
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Generated
    public String getName() {
        return this.name;
    }

    /**
     * Set the name property: The name property.
     * 
     * @param name the name value to set.
     * @return the SendOptionalBodyRequest object itself.
     */
    @Generated
    public SendOptionalBodyRequest setName(String name) {
        this.name = name;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SendOptionalBodyRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendOptionalBodyRequest if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the SendOptionalBodyRequest.
     */
    @Generated
    public static SendOptionalBodyRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            SendOptionalBodyRequest deserializedSendOptionalBodyRequest = new SendOptionalBodyRequest();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    deserializedSendOptionalBodyRequest.name = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedSendOptionalBodyRequest;
        });
    }
}
