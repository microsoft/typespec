// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents a set of parameters.
 */
public class ParameterGroupSchema extends ComplexSchema {
    private List<Parameter> parameters = new ArrayList<>();

    /**
     * Creates a new instance of the ParameterGroupSchema class.
     */
    public ParameterGroupSchema() {
    }

    /**
     * Gets the collection of properties that are in this object. (Required)
     *
     * @return The collection of properties that are in this object.
     */
    public List<Parameter> getParameters() {
        return parameters;
    }

    /**
     * Sets the collection of properties that are in this object. (Required)
     *
     * @param parameters The collection of properties that are in this object.
     */
    public void setParameters(List<Parameter> parameters) {
        this.parameters = parameters;
    }

    @Override
    public String toString() {
        return ParameterGroupSchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this))
            + "[parameters=" + Objects.toString(parameters, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(parameters);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ParameterGroupSchema)) {
            return false;
        }

        ParameterGroupSchema rhs = ((ParameterGroupSchema) other);
        return Objects.equals(parameters, rhs.parameters);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("parameters", parameters, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a ParameterGroupSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ParameterGroupSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ParameterGroupSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ParameterGroupSchema::new, (relations, fieldName, reader) -> {
            if ("parameters".equals(fieldName)) {
                relations.parameters = reader.readArray(Parameter::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
