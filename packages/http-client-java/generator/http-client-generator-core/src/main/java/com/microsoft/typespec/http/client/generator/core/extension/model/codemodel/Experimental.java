// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Describes an experimental API.
 */
public class Experimental {
    private String diagnosticId;
    private String warningText;

    /**
     * Gets the diagnostic identifier captured as metadata, without affecting generated Java annotations.
     *
     * @return the diagnostic identifier.
     */
    public String getDiagnosticId() {
        return diagnosticId;
    }

    /**
     * Sets the diagnostic identifier.
     *
     * @param diagnosticId the diagnostic identifier.
     */
    public void setDiagnosticId(String diagnosticId) {
        this.diagnosticId = diagnosticId;
    }

    /**
     * Gets the warning text, or null to use the generated annotation's WARNING_TEXT constant.
     *
     * @return the warning text.
     */
    public String getWarningText() {
        return warningText;
    }

    /**
     * Sets the warning text.
     *
     * @param warningText the warning text.
     */
    public void setWarningText(String warningText) {
        this.warningText = warningText;
    }
}
