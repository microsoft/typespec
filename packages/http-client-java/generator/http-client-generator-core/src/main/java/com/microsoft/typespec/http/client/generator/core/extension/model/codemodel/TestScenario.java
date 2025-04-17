// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;
import java.util.Map;

/**
 * Represents a test scenario.
 */
public class TestScenario {
    private String description;
    private List<String> requiredVariables;
    private Map<String, String> requiredVariablesDefault;
    private String scenario;
    private Boolean shareScope;
    private List<ScenarioStep> resolvedSteps;

    /**
     * Creates a new instance of the TestScenario class.
     */
    public TestScenario() {
    }

    /**
     * Gets the description of the scenario.
     *
     * @return The description of the scenario.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the scenario.
     *
     * @param description The description of the scenario.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the required variables for the scenario.
     *
     * @return The required variables for the scenario.
     */
    public List<String> getRequiredVariables() {
        return requiredVariables;
    }

    /**
     * Sets the required variables for the scenario.
     *
     * @param requiredVariables The required variables for the scenario.
     */
    public void setRequiredVariables(List<String> requiredVariables) {
        this.requiredVariables = requiredVariables;
    }

    /**
     * Gets the default values of the required variables.
     *
     * @return The default values of the required variables.
     */
    public Map<String, String> getRequiredVariablesDefault() {
        return requiredVariablesDefault;
    }

    /**
     * Sets the default values of the required variables.
     *
     * @param requiredVariablesDefault The default values of the required variables.
     */
    public void setRequiredVariablesDefault(Map<String, String> requiredVariablesDefault) {
        this.requiredVariablesDefault = requiredVariablesDefault;
    }

    /**
     * Gets the scenario.
     *
     * @return The scenario.
     */
    public String getScenario() {
        return scenario;
    }

    /**
     * Sets the scenario.
     *
     * @param scenario The scenario.
     */
    public void setScenario(String scenario) {
        this.scenario = scenario;
    }

    /**
     * Gets whether to share the scope and prepareSteps with other scenarios.
     *
     * @return Whether to share the scope and prepareSteps with other scenarios.
     */
    public Boolean getShareScope() {
        return shareScope;
    }

    /**
     * Sets whether to share the scope and prepareSteps with other scenarios.
     *
     * @param shareScope Whether to share the scope and prepareSteps with other scenarios.
     */
    public void setShareScope(Boolean shareScope) {
        this.shareScope = shareScope;
    }

    /**
     * Gets the resolved steps.
     *
     * @return The resolved steps.
     */
    @YamlProperty("_resolvedSteps")
    public List<ScenarioStep> getResolvedSteps() {
        return resolvedSteps;
    }

    /**
     * Sets the resolved steps.
     *
     * @param resolvedSteps The resolved steps.
     */
    public void setResolvedSteps(List<ScenarioStep> resolvedSteps) {
        this.resolvedSteps = resolvedSteps;
    }
}
