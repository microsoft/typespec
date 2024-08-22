// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * The settings for the AutoRest extension.
 */
public class AutorestSettings {
    private String title;
    private String tag;
    private String baseFolder;
    private String outputFolder;
    private List<String> security = new ArrayList<>();
    private List<String> securityScopes = new ArrayList<>();
    private String securityHeaderName;
    private String javaSdksFolder;
    private final List<String> inputFiles = new ArrayList<>();
    private final List<String> require = new ArrayList<>();

    /**
     * Creates a new instance of the AutorestSettings class.
     */
    public AutorestSettings() {
    }

    /**
     * Gets the title of what Autorest is generation.
     *
     * @return The title of what Autorest is generating.
     */
    public String getTitle() {
        return this.title;
    }

    /**
     * Set the title of what Autorest is generating.
     *
     * @param title The title of what Autorest is generating.
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Gets the tag for what Autorest is generating.
     *
     * @return The tag for what Autorest is generating.
     */
    public String getTag() {
        return tag;
    }

    /**
     * Sets the tag for what Autorest is generating.
     *
     * @param tag The tag for what Autorest is generating.
     */
    public void setTag(String tag) {
        this.tag = tag;
    }

    /**
     * Gets the base folder for the generation.
     *
     * @return The base folder for the generation.
     */
    public String getBaseFolder() {
        return baseFolder;
    }

    /**
     * Sets the base folder for the generation.
     *
     * @param baseFolder The base folder for the generation.
     */
    public void setBaseFolder(String baseFolder) {
        this.baseFolder = baseFolder;
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

    /**
     * Gets the security settings for the generation.
     *
     * @return The security settings for the generation.
     */
    public List<String> getSecurity() {
        return this.security;
    }

    /**
     * Sets the security settings for the generation.
     *
     * @param security The security settings for the generation.
     * @throws NullPointerException If {@code security} is null.
     */
    public void setSecurity(List<String> security) {
        this.security = Objects.requireNonNull(security);
    }

    /**
     * Gets the security scopes for the generation.
     *
     * @return The security scopes for the generation.
     */
    public List<String> getSecurityScopes() {
        return this.securityScopes;
    }

    /**
     * Sets the security scopes for the generation.
     *
     * @param securityScopes The security scopes for the generation.
     * @throws NullPointerException If {@code securityScopes} is null.
     */
    public void setSecurityScopes(List<String> securityScopes) {
        this.securityScopes = Objects.requireNonNull(securityScopes);
    }

    /**
     * Gets the security header name for the generation.
     *
     * @return The security header name for the generation.
     */
    public String getSecurityHeaderName() {
        return this.securityHeaderName;
    }

    /**
     * Sets the security header name for the generation.
     *
     * @param securityHeaderName The security header name for the generation.
     */
    public void setSecurityHeaderName(String securityHeaderName) {
        this.securityHeaderName = securityHeaderName;
    }

    /**
     * Gets the folder containing the Java SDKs for the generation.
     *
     * @return The folder containing the Java SDKs for the generation.
     */
    public String getJavaSdksFolder() {
        return javaSdksFolder;
    }

    /**
     * Sets the folder containing the Java SDKs for the generation.
     *
     * @param javaSdksFolder The folder containing the Java SDKs for the generation.
     */
    public void setJavaSdksFolder(String javaSdksFolder) {
        this.javaSdksFolder = javaSdksFolder;
    }

    /**
     * Gets the input files for the generation.
     *
     * @return The input files for the generation.
     */
    public List<String> getInputFiles() {
        return inputFiles;
    }

    /**
     * Gets the required plugins for the generation.
     *
     * @return The required plugins for the generation.
     */
    public List<String> getRequire() {
        return require;
    }
}
