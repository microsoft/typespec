// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a test model.
 */
public class TestModel implements JsonSerializable<TestModel> {
    private List<ScenarioTest> scenarioTests;

    /**
     * Creates a new instance of the TestModel class.
     */
    public TestModel() {
    }

    /**
     * Gets the API scenario definitions.
     *
     * @return The API scenario definitions.
     */
    public List<ScenarioTest> getScenarioTests() {
        return scenarioTests;
    }

    /**
     * Sets the API scenario definitions.
     *
     * @param scenarioTests The API scenario definitions.
     */
    public void setScenarioTests(List<ScenarioTest> scenarioTests) {
        this.scenarioTests = scenarioTests;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("scenarioTests", scenarioTests, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a TestModel instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A TestModel instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static TestModel fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, TestModel::new, (model, fieldName, reader) -> {
            if ("scenarioTests".equals(fieldName)) {
                model.scenarioTests = reader.readArray(ScenarioTest::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
