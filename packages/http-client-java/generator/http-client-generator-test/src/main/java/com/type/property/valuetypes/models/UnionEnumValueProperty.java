// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.type.property.valuetypes.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * Template type for testing models with specific properties. Pass in the type of the property you are looking for.
 */
@Immutable
public final class UnionEnumValueProperty implements JsonSerializable<UnionEnumValueProperty> {
    /*
     * Property
     */
    @Generated
    private final ExtendedEnum property = ExtendedEnum.ENUM_VALUE2;

    /**
     * Creates an instance of UnionEnumValueProperty class.
     */
    @Generated
    public UnionEnumValueProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Generated
    public ExtendedEnum getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("property", this.property == null ? null : this.property.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnionEnumValueProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnionEnumValueProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnionEnumValueProperty.
     */
    @Generated
    public static UnionEnumValueProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionEnumValueProperty deserializedUnionEnumValueProperty = new UnionEnumValueProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedUnionEnumValueProperty;
        });
    }
}
