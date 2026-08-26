// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;
import java.util.Map;

/**
 * Represents a scenario test.
 *
 * @see <a
 * href="https://github.com/Azure/azure-rest-api-specs/blob/main/documentation/api-scenario/references/ApiScenarioDefinition.md">
 * Api Scenario Definition Reference
 * </a>
 */
public class ScenarioTest {
    private String filePath;
    private List<String> requiredVariables;
    private Map<String, String> requiredVariablesDefault;
    private List<TestScenario> scenarios;
    private ScenarioTestScope scope;
    private Boolean useArmTemplate;

    /**
     * Creates a new instance of the ScenarioTest class.
     */
    public ScenarioTest() {
    }

    /**
     * Gets the file path of the scenario test.
     *
     * @return The file path of the scenario test.
     */
    @YamlProperty("_filePath")
    public String getFilePath() {
        return filePath;
    }

    /**
     * Sets the file path of the scenario test.
     *
     * @param filePath The file path of the scenario test.
     */
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    /**
     * Gets the required variables.
     *
     * @return The required variables.
     */
    public List<String> getRequiredVariables() {
        return requiredVariables;
    }

    /**
     * Sets the required variables.
     *
     * @param requiredVariables The required variables.
     */
    public void setRequiredVariables(List<String> requiredVariables) {
        this.requiredVariables = requiredVariables;
    }

    /**
     * Gets the default values for the required variables.
     *
     * @return The default values for the required variables.
     */
    public Map<String, String> getRequiredVariablesDefault() {
        return requiredVariablesDefault;
    }

    /**
     * Sets the default values for the required variables.
     *
     * @param requiredVariablesDefault The default values for the required variables.
     */
    public void setRequiredVariablesDefault(Map<String, String> requiredVariablesDefault) {
        this.requiredVariablesDefault = requiredVariablesDefault;
    }

    /**
     * Gets the scenarios.
     *
     * @return The scenarios.
     */
    public List<TestScenario> getScenarios() {
        return scenarios;
    }

    /**
     * Sets the scenarios.
     *
     * @param scenarios The scenarios.
     */
    public void setScenarios(List<TestScenario> scenarios) {
        this.scenarios = scenarios;
    }

    /**
     * Gets the scope of the scenario test.
     *
     * @return The scope of the scenario test.
     */
    public ScenarioTestScope getScope() {
        return scope;
    }

    /**
     * Sets the scope of the scenario test.
     *
     * @param scope The scope of the scenario test.
     */
    public void setScope(ScenarioTestScope scope) {
        this.scope = scope;
    }

    /**
     * Gets whether to use an ARM template.
     *
     * @return Whether to use an ARM template.
     */
    public Boolean getUseArmTemplate() {
        return useArmTemplate;
    }

    /**
     * Sets whether to use an ARM template.
     *
     * @param useArmTemplate Whether to use an ARM template.
     */
    public void setUseArmTemplate(Boolean useArmTemplate) {
        this.useArmTemplate = useArmTemplate;
    }
}
