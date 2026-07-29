// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;

/**
 * Represents a server.
 */
public class Server {
    private String url;
    private Languages language;
    private List<Value> variables;

    /**
     * Creates a new instance of the Server class.
     */
    public Server() {
    }

    /**
     * Gets the URL of the server.
     *
     * @return The URL of the server.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the server.
     *
     * @param url The URL of the server.
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the language-specific information for the server.
     *
     * @return The language-specific information for the server.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language-specific information for the server.
     *
     * @param language The language-specific information for the server.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the variables for the server.
     *
     * @return The variables for the server.
     */
    public List<Value> getVariables() {
        return variables;
    }

    /**
     * Sets the variables for the server.
     *
     * @param variables The variables for the server.
     */
    public void setVariables(List<Value> variables) {
        this.variables = variables;
    }
}
