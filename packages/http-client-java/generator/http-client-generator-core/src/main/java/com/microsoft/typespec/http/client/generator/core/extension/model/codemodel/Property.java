// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a property that is a child value in an object.
 */
public class Property extends Value {
    private boolean readOnly;
    private String serializedName;
    private boolean isDiscriminator;
    private List<String> flattenedNames;
    private List<Parameter> originalParameter;
    private String clientDefaultValue;
    private String summary;
    // internal use, not from modelerfour
    private ObjectSchema parentSchema;

    /**
     * Creates a new instance of the Property class.
     */
    public Property() {
    }

    /**
     * Gets whether the property is read-only.
     *
     * @return Whether the property is read-only.
     */
    public boolean isReadOnly() {
        return readOnly;
    }

    /**
     * Sets whether the property is read-only.
     *
     * @param readOnly Whether the property is read-only.
     */
    public void setReadOnly(boolean readOnly) {
        this.readOnly = readOnly;
    }

    /**
     * Gets the wire name of this property. (Required)
     *
     * @return The wire name of this property.
     */
    public String getSerializedName() {
        return serializedName;
    }

    /**
     * Sets the wire name of this property. (Required)
     *
     * @param serializedName The wire name of this property.
     */
    public void setSerializedName(String serializedName) {
        this.serializedName = serializedName;
    }

    /**
     * Gets whether the property is used as a discriminator for a polymorphic type.
     *
     * @return Whether the property is used as a discriminator for a polymorphic type.
     */
    public boolean isIsDiscriminator() {
        return isDiscriminator;
    }

    /**
     * Sets whether the property is used as a discriminator for a polymorphic type.
     *
     * @param isDiscriminator Whether the property is used as a discriminator for a polymorphic type.
     */
    public void setIsDiscriminator(boolean isDiscriminator) {
        this.isDiscriminator = isDiscriminator;
    }

    /**
     * Gets the flattened names of this property.
     *
     * @return The flattened names of this property.
     */
    public List<String> getFlattenedNames() {
        return flattenedNames;
    }

    /**
     * Sets the flattened names of this property.
     *
     * @param flattenedNames The flattened names of this property.
     */
    public void setFlattenedNames(List<String> flattenedNames) {
        this.flattenedNames = flattenedNames;
    }

    /**
     * Gets the parent schema of this property.
     *
     * @return The parent schema of this property.
     */
    public ObjectSchema getParentSchema() {
        return parentSchema;
    }

    /**
     * Sets the parent schema of this property.
     *
     * @param parentSchema The parent schema of this property.
     */
    public void setParentSchema(ObjectSchema parentSchema) {
        this.parentSchema = parentSchema;
    }

    /**
     * Gets the original parameter that this property is derived from.
     *
     * @return The original parameter that this property is derived from.
     */
    public List<Parameter> getOriginalParameter() {
        return originalParameter;
    }

    /**
     * Sets the original parameter that this property is derived from.
     *
     * @param originalParameter The original parameter that this property is derived from.
     */
    public void setOriginalParameter(List<Parameter> originalParameter) {
        this.originalParameter = originalParameter;
    }

    /**
     * Gets the client default value of this property.
     *
     * @return The client default value of this property.
     */
    public String getClientDefaultValue() {
        return clientDefaultValue;
    }

    /**
     * Sets the client default value of this property.
     *
     * @param clientDefaultValue The client default value of this property.
     */
    public void setClientDefaultValue(String clientDefaultValue) {
        this.clientDefaultValue = clientDefaultValue;
    }

    @Override
    public String getSummary() {
        return summary;
    }

    @Override
    public void setSummary(String summary) {
        this.summary = summary;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeBooleanField("readOnly", readOnly)
            .writeStringField("serializedName", serializedName)
            .writeBooleanField("isDiscriminator", isDiscriminator)
            .writeArrayField("flattenedNames", flattenedNames, JsonWriter::writeString)
            .writeArrayField("originalParameter", originalParameter, JsonWriter::writeJson)
            .writeStringField("clientDefaultValue", clientDefaultValue)
            .writeStringField("summary", summary)
            .writeEndObject();
    }

    /**
     * Deserializes a Property instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Property instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Property fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Property::new, (property, fieldName, reader) -> {
            if (property.tryConsumeParentProperties(property, fieldName, reader)) {
                return;
            }

            if ("readOnly".equals(fieldName)) {
                property.readOnly = reader.getBoolean();
            } else if ("serializedName".equals(fieldName)) {
                property.serializedName = reader.getString();
            } else if ("isDiscriminator".equals(fieldName)) {
                property.isDiscriminator = reader.getBoolean();
            } else if ("flattenedNames".equals(fieldName)) {
                property.flattenedNames = reader.readArray(JsonReader::getString);
            } else if ("originalParameter".equals(fieldName)) {
                property.originalParameter = reader.readArray(Parameter::fromJson);
            } else if ("clientDefaultValue".equals(fieldName)) {
                property.clientDefaultValue = reader.getString();
            } else if ("summary".equals(fieldName)) {
                property.summary = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
