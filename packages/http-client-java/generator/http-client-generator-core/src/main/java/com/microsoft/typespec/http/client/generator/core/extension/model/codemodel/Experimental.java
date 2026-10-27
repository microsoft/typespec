// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Describes an experimental API.
 */
public class Experimental {
    private String warningText;

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
