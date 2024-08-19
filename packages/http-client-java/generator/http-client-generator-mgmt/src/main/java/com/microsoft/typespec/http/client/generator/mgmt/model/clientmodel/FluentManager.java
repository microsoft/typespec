// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Model for Manager.
 */
public class FluentManager {

    private final Client client;

    private final ClassType type;

    private final String serviceName;

    private final List<FluentManagerProperty> properties = new ArrayList<>();

    public FluentManager(Client client, String clientName) {
        JavaSettings settings = JavaSettings.getInstance();

        this.client = client;

        this.serviceName = FluentUtils.getServiceName(clientName);

        this.type = new ClassType.Builder()
                .packageName(settings.getPackage())
                .name(CodeNamer.toPascalCase(this.serviceName) + "Manager")
                .build();
    }

    public Client getClient() {
        return client;
    }

    public ClassType getType() {
        return type;
    }

    public String getDescription() {
        String description = String.format("Entry point to %1$s.", this.getType().getName());
        if (!CoreUtils.isNullOrEmpty(client.getClientDescription())) {
            description += "\n" + client.getClientDescription();
        }
        return description;
    }

    public String getServiceName() {
        return serviceName;
    }

    public List<FluentManagerProperty> getProperties() {
        return properties;
    }
}
