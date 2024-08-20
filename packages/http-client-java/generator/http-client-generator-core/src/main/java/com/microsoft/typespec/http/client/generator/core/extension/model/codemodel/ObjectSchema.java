// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an object with child properties.
 */
public class ObjectSchema extends ComplexSchema {
    private Discriminator discriminator;
    private List<Property> properties = new ArrayList<>();
    private double maxProperties;
    private double minProperties;
    private Relations parents;
    private Relations children;
    private String discriminatorValue;
    // internal use, not from modelerfour
    private boolean flattenedSchema;
    // internal use, not from modelerfour
    private boolean stronglyTypedHeader;
    private String crossLanguageDefinitionId;

    /**
     * Creates a new instance of the ObjectSchema class.
     */
    public ObjectSchema() {
    }

    /**
     * Gets the discriminator for this object.
     *
     * @return The discriminator for this object.
     */
    public Discriminator getDiscriminator() {
        return discriminator;
    }

    /**
     * Sets the discriminator for this object.
     *
     * @param discriminator The discriminator for this object.
     */
    public void setDiscriminator(Discriminator discriminator) {
        this.discriminator = discriminator;
    }

    /**
     * Gets the properties that are in this object.
     *
     * @return The properties that are in this object.
     */
    public List<Property> getProperties() {
        return properties;
    }

    /**
     * Sets the properties that are in this object.
     *
     * @param properties The properties that are in this object.
     */
    public void setProperties(List<Property> properties) {
        this.properties = properties;
    }

    /**
     * Gets the maximum number of properties permitted.
     *
     * @return The maximum number of properties permitted.
     */
    public double getMaxProperties() {
        return maxProperties;
    }

    /**
     * Sets the maximum number of properties permitted.
     *
     * @param maxProperties The maximum number of properties permitted.
     */
    public void setMaxProperties(double maxProperties) {
        this.maxProperties = maxProperties;
    }

    /**
     * Gets the minimum number of properties permitted.
     *
     * @return The minimum number of properties permitted.
     */
    public double getMinProperties() {
        return minProperties;
    }

    /**
     * Sets the minimum number of properties permitted.
     *
     * @param minProperties The minimum number of properties permitted.
     */
    public void setMinProperties(double minProperties) {
        this.minProperties = minProperties;
    }

    /**
     * Gets the parents of this object.
     *
     * @return The parents of this object.
     */
    public Relations getParents() {
        return parents;
    }

    /**
     * Sets the parents of this object.
     *
     * @param parents The parents of this object.
     */
    public void setParents(Relations parents) {
        this.parents = parents;
    }

    /**
     * Gets the children of this object.
     *
     * @return The children of this object.
     */
    public Relations getChildren() {
        return children;
    }

    /**
     * Sets the children of this object.
     *
     * @param children The children of this object.
     */
    public void setChildren(Relations children) {
        this.children = children;
    }

    /**
     * Gets the discriminator value for this object.
     *
     * @return The discriminator value for this object.
     */
    public String getDiscriminatorValue() {
        return discriminatorValue;
    }

    /**
     * Sets the discriminator value for this object.
     *
     * @param discriminatorValue The discriminator value for this object.
     */
    public void setDiscriminatorValue(String discriminatorValue) {
        this.discriminatorValue = discriminatorValue;
    }

    /**
     * Gets whether this schema represents a flattened schema.
     *
     * @return Whether this schema represents a flattened schema.
     */
    public boolean isFlattenedSchema() {
        return flattenedSchema;
    }

    /**
     * Sets whether this schema represents a flattened schema.
     *
     * @param flattenedSchema Whether this schema represents a flattened schema.
     */
    public void setFlattenedSchema(boolean flattenedSchema) {
        this.flattenedSchema = flattenedSchema;
    }

    /**
     * Gets whether this schema represents a strongly-typed HTTP headers object.
     *
     * @return Whether this schema represents a strongly-typed HTTP headers object.
     */
    public boolean isStronglyTypedHeader() {
        return stronglyTypedHeader;
    }

    /**
     * Sets whether this schema represents a strongly-typed HTTP headers object.
     *
     * @param stronglyTypedHeader Whether this schema represents a strongly-typed HTTP headers object.
     */
    public void setStronglyTypedHeader(boolean stronglyTypedHeader) {
        this.stronglyTypedHeader = stronglyTypedHeader;
    }

    /**
     * Gets the cross-language definition ID for this object.
     *
     * @return The cross-language definition ID for this object.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Sets the cross-language definition ID for this object.
     *
     * @param crossLanguageDefinitionId The cross-language definition ID for this object.
     */
    public void setCrossLanguageDefinitionId(String crossLanguageDefinitionId) {
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeJsonField("discriminator", discriminator)
            .writeArrayField("properties", properties, JsonWriter::writeJson)
            .writeDoubleField("maxProperties", maxProperties)
            .writeDoubleField("minProperties", minProperties)
            .writeJsonField("parents", parents)
            .writeJsonField("children", children)
            .writeStringField("discriminatorValue", discriminatorValue)
            .writeEndObject();
    }

    /**
     * Deserializes an ObjectSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An ObjectSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ObjectSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ObjectSchema::new, (schema, fieldName, reader) -> {
            if (schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                return;
            }

            if ("discriminator".equals(fieldName)) {
                schema.discriminator = Discriminator.fromJson(reader);
            } else if ("properties".equals(fieldName)) {
                schema.properties = reader.readArray(Property::fromJson);
            } else if ("maxProperties".equals(fieldName)) {
                schema.maxProperties = reader.getDouble();
            } else if ("minProperties".equals(fieldName)) {
                schema.minProperties = reader.getDouble();
            } else if ("parents".equals(fieldName)) {
                schema.parents = Relations.fromJson(reader);
            } else if ("children".equals(fieldName)) {
                schema.children = Relations.fromJson(reader);
            } else if ("discriminatorValue".equals(fieldName)) {
                schema.discriminatorValue = reader.getString();
            } else if ("flattenedSchema".equals(fieldName)) {
                schema.flattenedSchema = reader.getBoolean();
            } else if ("stronglyTypedHeader".equals(fieldName)) {
                schema.stronglyTypedHeader = reader.getBoolean();
            } else if ("crossLanguageDefinitionId".equals(fieldName)) {
                schema.crossLanguageDefinitionId = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
