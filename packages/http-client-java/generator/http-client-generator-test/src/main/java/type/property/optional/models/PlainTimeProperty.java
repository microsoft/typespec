// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.property.optional.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a plainTime property.
 */
@Fluent
public final class PlainTimeProperty implements JsonSerializable<PlainTimeProperty> {
    /*
     * Property
     */
    @Generated
    private String property;

    /**
     * Creates an instance of PlainTimeProperty class.
     */
    @Generated
    public PlainTimeProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Generated
    public String getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the PlainTimeProperty object itself.
     */
    @Generated
    public PlainTimeProperty setProperty(String property) {
        this.property = property;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PlainTimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PlainTimeProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the PlainTimeProperty.
     */
    @Generated
    public static PlainTimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            PlainTimeProperty deserializedPlainTimeProperty = new PlainTimeProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedPlainTimeProperty.property = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedPlainTimeProperty;
        });
    }
}
