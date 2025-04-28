// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

/**
 * Represents the options for a long-running operation.
 */
public class XmsLongRunningOperationOptions {
    // azure-async-operation
    // location
    // original-uri
    private String finalStateVia;

    /**
     * Creates a new instance of the XmsLongRunningOperationOptions class.
     */
    public XmsLongRunningOperationOptions() {
    }

    /**
     * Gets the final state via.
     *
     * @return The final state via.
     */
    public String getFinalStateVia() {
        return finalStateVia;
    }

    /**
     * Sets the final state via.
     *
     * @param finalStateVia The final state via.
     */
    public void setFinalStateVia(String finalStateVia) {
        this.finalStateVia = finalStateVia;
    }
}
