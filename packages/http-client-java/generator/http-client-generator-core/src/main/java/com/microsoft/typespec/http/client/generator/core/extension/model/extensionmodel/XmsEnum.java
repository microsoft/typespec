// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

import static com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils.readObject;

/**
 * Represents an enum.
 */
public class XmsEnum implements JsonSerializable<XmsEnum> {
    private String name;
    private boolean modelAsString = false;
    private List<Value> values;

    /**
     * Creates a new instance of the XmsEnum class.
     */
    public XmsEnum() {
    }

    /**
     * Gets the name of the enum.
     *
     * @return The name of the enum.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the enum.
     *
     * @param name The name of the enum.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets whether the enum is represented as a string.
     *
     * @return Whether the enum is represented as a string.
     */
    public boolean isModelAsString() {
        return modelAsString;
    }

    /**
     * Sets whether the enum is represented as a string.
     *
     * @param modelAsString Whether the enum is represented as a string.
     */
    public void setModelAsString(boolean modelAsString) {
        this.modelAsString = modelAsString;
    }

    /**
     * Gets the values of the enum.
     *
     * @return The values of the enum.
     */
    public List<Value> getValues() {
        return values;
    }

    /**
     * Sets the values of the enum.
     *
     * @param values The values of the enum.
     */
    public void setValues(List<Value> values) {
        this.values = values;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("name", name)
            .writeBooleanField("modelAsString", modelAsString)
            .writeArrayField("values", values, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes an XmsEnum instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An XmsEnum instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XmsEnum fromJson(JsonReader jsonReader) throws IOException {
        return readObject(jsonReader, XmsEnum::new, (xmsEnum, fieldName, reader) -> {
            if ("name".equals(fieldName)) {
                xmsEnum.name = reader.getString();
            } else if ("modelAsString".equals(fieldName)) {
                xmsEnum.modelAsString = reader.getBoolean();
            } else if ("values".equals(fieldName)) {
                xmsEnum.values = reader.readArray(Value::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }

    /**
     * Represents a value of the enum.
     */
    public static class Value implements JsonSerializable<Value> {
        private String value;
        private String description;
        private String name;

        /**
         * Creates a new instance of the Value class.
         */
        public Value() {
        }

        /**
         * Gets the value of the enum.
         *
         * @return The value of the enum.
         */
        public String getValue() {
            return value;
        }

        /**
         * Sets the value of the enum.
         *
         * @param value The value of the enum.
         */
        public void setValue(String value) {
            this.value = value;
        }

        /**
         * Gets the description of the value.
         *
         * @return The description of the value.
         */
        public String getDescription() {
            return description;
        }

        /**
         * Sets the description of the value.
         *
         * @param description The description of the value.
         */
        public void setDescription(String description) {
            this.description = description;
        }

        /**
         * Gets the name of the value.
         *
         * @return The name of the value.
         */
        public String getName() {
            return name;
        }

        /**
         * Sets the name of the value.
         *
         * @param name The name of the value.
         */
        public void setName(String name) {
            this.name = name;
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            return jsonWriter.writeStartObject()
                .writeStringField("value", value)
                .writeStringField("description", description)
                .writeStringField("name", name)
                .writeEndObject();
        }

        /**
         * Deserializes a Value instance from the JSON data.
         *
         * @param jsonReader The JSON reader to deserialize from.
         * @return A Value instance deserialized from the JSON data.
         * @throws IOException If an error occurs during deserialization.
         */
        public static Value fromJson(JsonReader jsonReader) throws IOException {
            return readObject(jsonReader, Value::new, (value, fieldName, reader) -> {
                if ("value".equals(fieldName)) {
                    value.value = reader.getString();
                } else if ("description".equals(fieldName)) {
                    value.description = reader.getString();
                } else if ("name".equals(fieldName)) {
                    value.name = reader.getString();
                } else {
                    reader.skipChildren();
                }
            });
        }
    }
}
