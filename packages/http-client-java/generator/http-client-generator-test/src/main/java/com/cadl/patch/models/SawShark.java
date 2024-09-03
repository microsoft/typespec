// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.patch.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import com.cadl.patch.implementation.JsonMergePatchHelper;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * The third level model SawShark in polymorphic multiple levels inheritance.
 */
@Fluent
public final class SawShark extends Shark {
    /**
     * Stores updated model property, the value is property name, not serialized name.
     */
    @Generated
    private final Set<String> updatedProperties = new HashSet<>();

    /**
     * Creates an instance of SawShark class.
     */
    @Generated
    public SawShark() {
        this.kind = "shark";
        this.sharktype = "saw";
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public SawShark setWeight(Integer weight) {
        super.setWeight(weight);
        this.updatedProperties.add("weight");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public SawShark setAge(int age) {
        super.setAge(age);
        this.updatedProperties.add("age");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public SawShark setColor(String color) {
        super.setColor(color);
        this.updatedProperties.add("color");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        if (JsonMergePatchHelper.getFishAccessor().isJsonMergePatch(this)) {
            return toJsonMergePatch(jsonWriter);
        } else {
            jsonWriter.writeStartObject();
            jsonWriter.writeStringField("kind", this.kind);
            jsonWriter.writeIntField("age", getAge());
            jsonWriter.writeStringField("color", getColor());
            jsonWriter.writeNumberField("weight", getWeight());
            jsonWriter.writeStringField("sharktype", this.sharktype);
            return jsonWriter.writeEndObject();
        }
    }

    @Generated
    private JsonWriter toJsonMergePatch(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("kind", this.kind);
        if (updatedProperties.contains("age")) {
            jsonWriter.writeIntField("age", getAge());
        }
        if (updatedProperties.contains("color")) {
            if (getColor() == null) {
                jsonWriter.writeNullField("color");
            } else {
                jsonWriter.writeStringField("color", getColor());
            }
        }
        if (updatedProperties.contains("weight")) {
            if (getWeight() == null) {
                jsonWriter.writeNullField("weight");
            } else {
                jsonWriter.writeNumberField("weight", getWeight());
            }
        }
        jsonWriter.writeStringField("sharktype", this.sharktype);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SawShark from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SawShark if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SawShark.
     */
    @Generated
    public static SawShark fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            SawShark deserializedSawShark = new SawShark();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if (Shark.fromJsonShared(reader, fieldName, deserializedSawShark)) {
                    continue;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedSawShark;
        });
    }
}
