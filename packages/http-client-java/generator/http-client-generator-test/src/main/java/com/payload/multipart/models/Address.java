// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.payload.multipart.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The Address model.
 */
@Immutable
public final class Address implements JsonSerializable<Address> {
    /*
     * The city property.
     */
    @Generated
    private final String city;

    /**
     * Creates an instance of Address class.
     * 
     * @param city the city value to set.
     */
    @Generated
    public Address(String city) {
        this.city = city;
    }

    /**
     * Get the city property: The city property.
     * 
     * @return the city value.
     */
    @Generated
    public String getCity() {
        return this.city;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("city", this.city);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Address from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Address if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Address.
     */
    @Generated
    public static Address fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String city = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("city".equals(fieldName)) {
                    city = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new Address(city);
        });
    }
}
