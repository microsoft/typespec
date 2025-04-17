// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import java.util.Map;

/**
 * Represents the examples of a model.
 */
public class XmsExamples {
    private Map<String, Object> examples;

    /**
     * Creates a new instance of the XmsExamples class.
     */
    public XmsExamples() {
    }

    /**
     * Gets the examples of the model.
     *
     * @return The examples of the model.
     */
    public Map<String, Object> getExamples() {
        return examples;
    }

    /**
     * Sets the examples of the model.
     *
     * @param examples The examples of the model.
     */
    public void setExamples(Map<String, Object> examples) {
        this.examples = examples;
    }
}
