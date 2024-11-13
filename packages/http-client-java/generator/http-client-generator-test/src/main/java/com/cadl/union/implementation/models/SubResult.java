// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.union.implementation.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.core.util.BinaryData;
import com.azure.json.JsonReader;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import com.cadl.union.models.Result;
import java.io.IOException;

/**
 * The SubResult model.
 */
@Fluent
public final class SubResult extends Result {
    /*
     * The text property.
     */
    @Generated
    private String text;

    /*
     * The arrayData property.
     */
    @Generated
    private BinaryData arrayData;

    /**
     * Creates an instance of SubResult class.
     * 
     * @param name the name value to set.
     * @param data the data value to set.
     */
    @Generated
    public SubResult(String name, BinaryData data) {
        super(name, data);
    }

    /**
     * Get the text property: The text property.
     * 
     * @return the text value.
     */
    @Generated
    public String getText() {
        return this.text;
    }

    /**
     * Set the text property: The text property.
     * 
     * @param text the text value to set.
     * @return the SubResult object itself.
     */
    @Generated
    public SubResult setText(String text) {
        this.text = text;
        return this;
    }

    /**
     * Get the arrayData property: The arrayData property.
     * 
     * @return the arrayData value.
     */
    @Generated
    public BinaryData getArrayData() {
        return this.arrayData;
    }

    /**
     * Set the arrayData property: The arrayData property.
     * 
     * @param arrayData the arrayData value to set.
     * @return the SubResult object itself.
     */
    @Generated
    public SubResult setArrayData(BinaryData arrayData) {
        this.arrayData = arrayData;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public SubResult setResult(Result result) {
        super.setResult(result);
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
        jsonWriter.writeFieldName("data");
        getData().writeTo(jsonWriter);
        jsonWriter.writeJsonField("result", getResult());
        jsonWriter.writeStringField("text", this.text);
        if (this.arrayData != null) {
            jsonWriter.writeFieldName("arrayData");
            this.arrayData.writeTo(jsonWriter);
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SubResult from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SubResult if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SubResult.
     */
    @Generated
    public static SubResult fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            BinaryData data = null;
            Result result = null;
            String text = null;
            BinaryData arrayData = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("data".equals(fieldName)) {
                    data = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("result".equals(fieldName)) {
                    result = Result.fromJson(reader);
                } else if ("text".equals(fieldName)) {
                    text = reader.getString();
                } else if ("arrayData".equals(fieldName)) {
                    arrayData = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            SubResult deserializedSubResult = new SubResult(name, data);
            deserializedSubResult.setResult(result);
            deserializedSubResult.text = text;
            deserializedSubResult.arrayData = arrayData;

            return deserializedSubResult;
        });
    }
}
