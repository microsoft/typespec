// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armresourceprovider.fluent.models;

import com.azure.core.annotation.Immutable;
import com.cadl.armresourceprovider.models.ProvisioningState;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Child Resource Properties.
 */
@Immutable
public final class ChildResourceProperties {
    /*
     * Provisioning State of Top Level Arm Resource
     */
    @JsonProperty(value = "provisioningState", access = JsonProperty.Access.WRITE_ONLY)
    private ProvisioningState provisioningState;

    /**
     * Creates an instance of ChildResourceProperties class.
     */
    public ChildResourceProperties() {
    }

    /**
     * Get the provisioningState property: Provisioning State of Top Level Arm Resource.
     * 
     * @return the provisioningState value.
     */
    public ProvisioningState provisioningState() {
        return this.provisioningState;
    }

    /**
     * Validates the instance.
     * 
     * @throws IllegalArgumentException thrown if the instance is not valid.
     */
    public void validate() {
    }
}
