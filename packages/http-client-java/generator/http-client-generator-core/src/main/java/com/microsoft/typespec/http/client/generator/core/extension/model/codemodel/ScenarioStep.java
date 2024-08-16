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
 * Represents a step in a scenario.
 */
public class ScenarioStep implements JsonSerializable<ScenarioStep> {
    private TestScenarioStepType type;
    private String operationId;
    private String exampleFile;
    private String exampleName;
    private Map<String, Object> requestParameters;
    private String description;

    /**
     * Creates a new instance of the ScenarioStep class.
     */
    public ScenarioStep() {
    }

    /**
     * Gets the description of the step.
     *
     * @return The description of the step.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the step.
     *
     * @param description The description of the step.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the type of the step.
     *
     * @return The type of the step.
     */
    public TestScenarioStepType getType() {
        return type;
    }

    /**
     * Sets the type of the step.
     *
     * @param type The type of the step.
     */
    public void setType(TestScenarioStepType type) {
        this.type = type;
    }

    /**
     * Gets the operation id of the step.
     *
     * @return The operation id of the step.
     */
    public String getOperationId() {
        return operationId;
    }

    /**
     * Sets the operation id of the step.
     *
     * @param operationId The operation id of the step.
     */
    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }

    /**
     * Gets the example file of the step.
     *
     * @return The example file of the step.
     */
    public String getExampleFile() {
        return exampleFile;
    }

    /**
     * Sets the example file of the step.
     *
     * @param exampleFile The example file of the step.
     */
    public void setExampleFile(String exampleFile) {
        this.exampleFile = exampleFile;
    }

    /**
     * Gets the example name of the step.
     *
     * @return The example name of the step.
     */
    public String getExampleName() {
        return exampleName;
    }

    /**
     * Sets the example name of the step.
     *
     * @param exampleName The example name of the step.
     */
    public void setExampleName(String exampleName) {
        this.exampleName = exampleName;
    }

    /**
     * Gets the request parameters of the step.
     *
     * @return The request parameters of the step.
     */
    public Map<String, Object> getRequestParameters() {
        return requestParameters;
    }

    /**
     * Sets the request parameters of the step.
     *
     * @param requestParameters The request parameters of the step.
     */
    public void setRequestParameters(Map<String, Object> requestParameters) {
        this.requestParameters = requestParameters;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("type", type == null ? null : type.toString())
            .writeStringField("operationId", operationId)
            .writeStringField("exampleFile", exampleFile)
            .writeStringField("exampleName", exampleName)
            .writeMapField("requestParameters", requestParameters, JsonWriter::writeUntyped)
            .writeStringField("description", description)
            .writeEndObject();
    }

    /**
     * Deserializes a ScenarioStep instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ScenarioStep instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ScenarioStep fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ScenarioStep::new, (step, fieldName, reader) -> {
            if ("type".equals(fieldName)) {
                step.type = TestScenarioStepType.fromValue(reader.getString());
            } else if ("operationId".equals(fieldName)) {
                step.operationId = reader.getString();
            } else if ("exampleFile".equals(fieldName)) {
                step.exampleFile = reader.getString();
            } else if ("exampleName".equals(fieldName)) {
                step.exampleName = reader.getString();
            } else if ("requestParameters".equals(fieldName)) {
                step.requestParameters = reader.readMap(JsonReader::readUntyped);
            } else if ("description".equals(fieldName)) {
                step.description = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
