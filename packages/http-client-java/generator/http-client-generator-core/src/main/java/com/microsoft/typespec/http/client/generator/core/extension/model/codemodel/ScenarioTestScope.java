// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents the scope of a test scenario.
 */
public enum ScenarioTestScope {

    /**
     * All the following API scenario and steps should be under some resourceGroup. It means:
     * The consumer (API scenario runner or anything consumes API scenario) SHOULD maintain the resource group itself.
     * Usually it requires user to input the subscriptionId/location, then it creates the resource group before test
     * running, and deletes the resource group after running
     * The consumer SHOULD set the following variables:
     * - subscriptionId
     * - resourceGroupName
     * - location
     */
    RESOURCE_GROUP("ResourceGroup");

    private final String value;

    ScenarioTestScope(String value) {
        this.value = value;
    }

    /**
     * Gets the ScenarioTestScope from its value.
     *
     * @param value The value.
     * @return The ScenarioTestScope.
     * @throws IllegalArgumentException If the value is invalid.
     */
    public static ScenarioTestScope fromValue(String value) {
        if ("ResourceGroup".equals(value)) {
            return RESOURCE_GROUP;
        } else {
            throw new IllegalArgumentException(value);
        }
    }
}
