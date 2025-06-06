// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.property.nullable.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import type.property.nullable.implementation.JsonMergePatchHelper;

/**
 * Model with collection bytes properties.
 */
@Fluent
public final class CollectionsByteProperty implements JsonSerializable<CollectionsByteProperty> {
    /*
     * Required property
     */
    @Generated
    private String requiredProperty;

    /*
     * Property
     */
    @Generated
    private List<byte[]> nullableProperty;

    /**
     * Stores updated model property, the value is property name, not serialized name.
     */
    @Generated
    private final Set<String> updatedProperties = new HashSet<>();

    @Generated
    private boolean jsonMergePatch;

    @Generated
    private void serializeAsJsonMergePatch(boolean jsonMergePatch) {
        this.jsonMergePatch = jsonMergePatch;
    }

    static {
        JsonMergePatchHelper
            .setCollectionsBytePropertyAccessor(new JsonMergePatchHelper.CollectionsBytePropertyAccessor() {
                @Override
                public CollectionsByteProperty prepareModelForJsonMergePatch(CollectionsByteProperty model,
                    boolean jsonMergePatchEnabled) {
                    model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                    return model;
                }

                @Override
                public boolean isJsonMergePatch(CollectionsByteProperty model) {
                    return model.jsonMergePatch;
                }
            });
    }

    /**
     * Creates an instance of CollectionsByteProperty class.
     */
    @Generated
    public CollectionsByteProperty() {
    }

    /**
     * Get the requiredProperty property: Required property.
     * 
     * @return the requiredProperty value.
     */
    @Generated
    public String getRequiredProperty() {
        return this.requiredProperty;
    }

    /**
     * Set the requiredProperty property: Required property.
     * <p>Required when create the resource.</p>
     * 
     * @param requiredProperty the requiredProperty value to set.
     * @return the CollectionsByteProperty object itself.
     */
    @Generated
    public CollectionsByteProperty setRequiredProperty(String requiredProperty) {
        this.requiredProperty = requiredProperty;
        this.updatedProperties.add("requiredProperty");
        return this;
    }

    /**
     * Get the nullableProperty property: Property.
     * 
     * @return the nullableProperty value.
     */
    @Generated
    public List<byte[]> getNullableProperty() {
        return this.nullableProperty;
    }

    /**
     * Set the nullableProperty property: Property.
     * <p>Required when create the resource.</p>
     * 
     * @param nullableProperty the nullableProperty value to set.
     * @return the CollectionsByteProperty object itself.
     */
    @Generated
    public CollectionsByteProperty setNullableProperty(List<byte[]> nullableProperty) {
        this.nullableProperty = nullableProperty;
        this.updatedProperties.add("nullableProperty");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        if (jsonMergePatch) {
            return toJsonMergePatch(jsonWriter);
        } else {
            jsonWriter.writeStartObject();
            jsonWriter.writeStringField("requiredProperty", this.requiredProperty);
            jsonWriter.writeArrayField("nullableProperty", this.nullableProperty,
                (writer, element) -> writer.writeBinary(element));
            return jsonWriter.writeEndObject();
        }
    }

    @Generated
    private JsonWriter toJsonMergePatch(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (updatedProperties.contains("requiredProperty")) {
            if (this.requiredProperty == null) {
                jsonWriter.writeNullField("requiredProperty");
            } else {
                jsonWriter.writeStringField("requiredProperty", this.requiredProperty);
            }
        }
        if (updatedProperties.contains("nullableProperty")) {
            if (this.nullableProperty == null) {
                jsonWriter.writeNullField("nullableProperty");
            } else {
                jsonWriter.writeArrayField("nullableProperty", this.nullableProperty,
                    (writer, element) -> writer.writeBinary(element));
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CollectionsByteProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CollectionsByteProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the CollectionsByteProperty.
     */
    @Generated
    public static CollectionsByteProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            CollectionsByteProperty deserializedCollectionsByteProperty = new CollectionsByteProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("requiredProperty".equals(fieldName)) {
                    deserializedCollectionsByteProperty.requiredProperty = reader.getString();
                } else if ("nullableProperty".equals(fieldName)) {
                    List<byte[]> nullableProperty = reader.readArray(reader1 -> reader1.getBinary());
                    deserializedCollectionsByteProperty.nullableProperty = nullableProperty;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedCollectionsByteProperty;
        });
    }
}
