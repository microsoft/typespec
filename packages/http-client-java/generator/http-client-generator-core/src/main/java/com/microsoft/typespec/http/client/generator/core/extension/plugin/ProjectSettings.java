// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

/**
 * The settings for the project generation.
 */
public class ProjectSettings {
    private String outputFolder;

    /**
     * Creates a new instance of the ProjectSettings class.
     */
    public ProjectSettings() {
    }

    /**
     * Gets the output folder for the generation.
     *
     * @return The output folder for the generation.
     */
    public String getOutputFolder() {
        return outputFolder;
    }

    /**
     * Sets the output folder for the generation.
     *
     * @param outputFolder The output folder for the generation.
     */
    public void setOutputFolder(String outputFolder) {
        this.outputFolder = outputFolder;
    }
}
