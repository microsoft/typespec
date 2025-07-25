// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.methodoverride.implementation.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The GroupAllRequest model.
 */
@Fluent
public final class GroupAllRequest implements JsonSerializable<GroupAllRequest> {
    /*
     * The prop1 property.
     */
    @Generated
    private final String prop1;

    /*
     * The prop2 property.
     */
    @Generated
    private String prop2;

    /**
     * Creates an instance of GroupAllRequest class.
     * 
     * @param prop1 the prop1 value to set.
     */
    @Generated
    public GroupAllRequest(String prop1) {
        this.prop1 = prop1;
    }

    /**
     * Get the prop1 property: The prop1 property.
     * 
     * @return the prop1 value.
     */
    @Generated
    public String getProp1() {
        return this.prop1;
    }

    /**
     * Get the prop2 property: The prop2 property.
     * 
     * @return the prop2 value.
     */
    @Generated
    public String getProp2() {
        return this.prop2;
    }

    /**
     * Set the prop2 property: The prop2 property.
     * 
     * @param prop2 the prop2 value to set.
     * @return the GroupAllRequest object itself.
     */
    @Generated
    public GroupAllRequest setProp2(String prop2) {
        this.prop2 = prop2;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop1", this.prop1);
        jsonWriter.writeStringField("prop2", this.prop2);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of GroupAllRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GroupAllRequest if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GroupAllRequest.
     */
    @Generated
    public static GroupAllRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String prop1 = null;
            String prop2 = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop1".equals(fieldName)) {
                    prop1 = reader.getString();
                } else if ("prop2".equals(fieldName)) {
                    prop2 = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            GroupAllRequest deserializedGroupAllRequest = new GroupAllRequest(prop1);
            deserializedGroupAllRequest.prop2 = prop2;

            return deserializedGroupAllRequest;
        });
    }
}
