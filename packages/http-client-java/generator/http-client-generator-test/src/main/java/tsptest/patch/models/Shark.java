// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.patch.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import tsptest.patch.implementation.JsonMergePatchHelper;

/**
 * The second level model in polymorphic multiple levels inheritance and it defines a new discriminator.
 */
@Fluent
public class Shark extends Fish {
    /*
     * Discriminator property for Fish.
     */
    @Generated
    private String kind = "shark";

    /*
     * The sharktype property.
     */
    @Generated
    private String sharktype = "shark";

    /*
     * The weight property.
     */
    @Generated
    private Integer weight;

    /**
     * Stores updated model property, the value is property name, not serialized name.
     */
    @Generated
    private final Set<String> updatedProperties = new HashSet<>();

    static {
        JsonMergePatchHelper.setSharkAccessor(new JsonMergePatchHelper.SharkAccessor() {
            @Override
            public void setWeight(Shark model, Integer weight) {
                model.weight = weight;
            }
        });
    }

    /**
     * Creates an instance of Shark class.
     */
    @Generated
    public Shark() {
    }

    /**
     * Get the kind property: Discriminator property for Fish.
     * 
     * @return the kind value.
     */
    @Generated
    @Override
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the sharktype property: The sharktype property.
     * 
     * @return the sharktype value.
     */
    @Generated
    public String getSharktype() {
        return this.sharktype;
    }

    /**
     * Get the weight property: The weight property.
     * 
     * @return the weight value.
     */
    @Generated
    public Integer getWeight() {
        return this.weight;
    }

    /**
     * Set the weight property: The weight property.
     * 
     * @param weight the weight value to set.
     * @return the Shark object itself.
     */
    @Generated
    public Shark setWeight(Integer weight) {
        this.weight = weight;
        this.updatedProperties.add("weight");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public Shark setAge(int age) {
        super.setAge(age);
        this.updatedProperties.add("age");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public Shark setColor(String color) {
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
            jsonWriter.writeStringField("sharktype", this.sharktype);
            jsonWriter.writeNumberField("weight", this.weight);
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
        jsonWriter.writeStringField("sharktype", this.sharktype);
        if (updatedProperties.contains("weight")) {
            if (this.weight == null) {
                jsonWriter.writeNullField("weight");
            } else {
                jsonWriter.writeNumberField("weight", this.weight);
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Shark from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Shark if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Shark.
     */
    @Generated
    public static Shark fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String discriminatorValue = null;
            try (JsonReader readerToUse = reader.bufferObject()) {
                readerToUse.nextToken(); // Prepare for reading
                while (readerToUse.nextToken() != JsonToken.END_OBJECT) {
                    String fieldName = readerToUse.getFieldName();
                    readerToUse.nextToken();
                    if ("sharktype".equals(fieldName)) {
                        discriminatorValue = readerToUse.getString();
                        break;
                    } else {
                        readerToUse.skipChildren();
                    }
                }
                // Use the discriminator value to determine which subtype should be deserialized.
                if ("saw".equals(discriminatorValue)) {
                    return SawShark.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Generated
    static Shark fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Shark deserializedShark = new Shark();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    JsonMergePatchHelper.getFishAccessor().setId(deserializedShark, reader.getString());
                } else if ("name".equals(fieldName)) {
                    JsonMergePatchHelper.getFishAccessor().setName(deserializedShark, reader.getString());
                } else if ("age".equals(fieldName)) {
                    JsonMergePatchHelper.getFishAccessor().setAge(deserializedShark, reader.getInt());
                } else if ("color".equals(fieldName)) {
                    JsonMergePatchHelper.getFishAccessor().setColor(deserializedShark, reader.getString());
                } else if ("sharktype".equals(fieldName)) {
                    deserializedShark.sharktype = reader.getString();
                } else if ("weight".equals(fieldName)) {
                    deserializedShark.weight = reader.getNullable(JsonReader::getInt);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedShark;
        });
    }
}
