// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.property.additionalproperties.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.core.util.BinaryData;
import com.azure.json.JsonReader;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model extends from a type that extends from Record&lt;unknown&gt;.
 */
@Fluent
public final class ExtendsUnknownAdditionalPropertiesDerived extends ExtendsUnknownAdditionalProperties {
    /*
     * The index property
     */
    @Generated
    private final int index;

    /*
     * The age property
     */
    @Generated
    private Double age;

    /**
     * Creates an instance of ExtendsUnknownAdditionalPropertiesDerived class.
     * 
     * @param name the name value to set.
     * @param index the index value to set.
     */
    @Generated
    public ExtendsUnknownAdditionalPropertiesDerived(String name, int index) {
        super(name);
        this.index = index;
    }

    /**
     * Get the index property: The index property.
     * 
     * @return the index value.
     */
    @Generated
    public int getIndex() {
        return this.index;
    }

    /**
     * Get the age property: The age property.
     * 
     * @return the age value.
     */
    @Generated
    public Double getAge() {
        return this.age;
    }

    /**
     * Set the age property: The age property.
     * 
     * @param age the age value to set.
     * @return the ExtendsUnknownAdditionalPropertiesDerived object itself.
     */
    @Generated
    public ExtendsUnknownAdditionalPropertiesDerived setAge(Double age) {
        this.age = age;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeIntField("index", this.index);
        jsonWriter.writeNumberField("age", this.age);
        if (getAdditionalProperties() != null) {
            for (Map.Entry<String, BinaryData> additionalProperty : getAdditionalProperties().entrySet()) {
                jsonWriter.writeFieldName(additionalProperty.getKey());
                if (additionalProperty.getValue() == null) {
                    jsonWriter.writeNull();
                } else {
                    additionalProperty.getValue().writeTo(jsonWriter);
                }
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ExtendsUnknownAdditionalPropertiesDerived from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExtendsUnknownAdditionalPropertiesDerived if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ExtendsUnknownAdditionalPropertiesDerived.
     */
    @Generated
    public static ExtendsUnknownAdditionalPropertiesDerived fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            int index = 0;
            Double age = null;
            Map<String, BinaryData> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("index".equals(fieldName)) {
                    index = reader.getInt();
                } else if ("age".equals(fieldName)) {
                    age = reader.getNullable(JsonReader::getDouble);
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName,
                        reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped())));
                }
            }
            ExtendsUnknownAdditionalPropertiesDerived deserializedExtendsUnknownAdditionalPropertiesDerived
                = new ExtendsUnknownAdditionalPropertiesDerived(name, index);
            deserializedExtendsUnknownAdditionalPropertiesDerived.age = age;
            deserializedExtendsUnknownAdditionalPropertiesDerived.setAdditionalProperties(additionalProperties);

            return deserializedExtendsUnknownAdditionalPropertiesDerived;
        });
    }
}
