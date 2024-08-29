// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Map;

/**
 * Represents a discriminator for polymorphic types.
 */
public class Discriminator implements JsonSerializable<Discriminator> {
    private Property property;
    private Map<String, ComplexSchema> immediate;
    private Map<String, ComplexSchema> all;

    /**
     * Creates a new instance of the Discriminator class.
     */
    public Discriminator() {
    }

    /**
     * Gets the property that is used to discriminate between the polymorphic types.
     *
     * @return The property that is used to discriminate between the polymorphic types.
     */
    public Property getProperty() {
        return property;
    }

    /**
     * Sets the property that is used to discriminate between the polymorphic types.
     *
     * @param property The property that is used to discriminate between the polymorphic types.
     */
    public void setProperty(Property property) {
        this.property = property;
    }

    /**
     * Gets the immediate polymorphic types.
     *
     * @return The immediate polymorphic types.
     */
    public Map<String, ComplexSchema> getImmediate() {
        return immediate;
    }

    /**
     * Sets the immediate polymorphic types.
     *
     * @param immediate The immediate polymorphic types.
     */
    public void setImmediate(Map<String, ComplexSchema> immediate) {
        this.immediate = immediate;
    }

    /**
     * Gets all polymorphic types.
     *
     * @return All polymorphic types.
     */
    public Map<String, ComplexSchema> getAll() {
        return all;
    }

    /**
     * Sets all polymorphic types.
     *
     * @param all All polymorphic types.
     */
    public void setAll(Map<String, ComplexSchema> all) {
        this.all = all;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("property", property)
            .writeMapField("immediate", immediate, JsonWriter::writeJson)
            .writeMapField("all", all, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Discriminator instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Discriminator instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Discriminator fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Discriminator::new, (discriminator, fieldName, reader) -> {
            if ("property".equals(fieldName)) {
                discriminator.property = Property.fromJson(reader);
            } else if ("immediate".equals(fieldName)) {
                discriminator.immediate = reader.readMap(ComplexSchema::fromJson);
            } else if ("all".equals(fieldName)) {
                discriminator.all = reader.readMap(ComplexSchema::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
