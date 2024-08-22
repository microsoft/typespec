// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;

/**
 * Convenient class for global variables.
 *
 * Avoid using it unless no better solution.
 */
public class FluentStatic {

    private static Client client;

    private static FluentClient fluentClient;

    private static FluentJavaSettings fluentJavaSettings;

    private FluentStatic() {
    }

    /**
     * @return the client on service client and method groups.
     */
    public static Client getClient() {
        return client;
    }

    public static void setClient(Client client) {
        FluentStatic.client = client;
    }

    /**
     * @return the client on Fluent manager, resource collections and instances (models)
     */
    public static FluentManager getFluentManager() {
        return fluentClient.getManager();
    }

    public static void setFluentClient(FluentClient fluentClient) {
        FluentStatic.fluentClient = fluentClient;
    }

    /**
     * @return settings for Fluent.
     */
    public static FluentJavaSettings getFluentJavaSettings() {
        return fluentJavaSettings;
    }

    public static void setFluentJavaSettings(FluentJavaSettings fluentJavaSettings) {
        FluentStatic.fluentJavaSettings = fluentJavaSettings;
    }
}
