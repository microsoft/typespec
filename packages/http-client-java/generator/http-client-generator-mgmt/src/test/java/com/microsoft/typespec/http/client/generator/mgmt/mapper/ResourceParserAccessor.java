// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ModelCategory;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.action.ResourceActions;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.delete.ResourceDelete;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.get.ResourceRefresh;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import java.util.List;
import java.util.Optional;

public class ResourceParserAccessor {

    public static List<ResourceCreate> resolveResourceCreate(FluentResourceCollection collection,
        List<FluentResourceModel> availableFluentModels, List<ClientModel> availableModels) {
        return ResourceParser.resolveResourceCreate(collection, availableFluentModels, availableModels);
    }

    public static List<ResourceCreate> resolveResourceCreate(FluentResourceCollection collection,
        List<FluentResourceModel> availableFluentModels, List<ClientModel> availableModels,
        List<ModelCategory> categories) {
        return ResourceParser.resolveResourceCreate(collection, availableFluentModels, availableModels, categories);
    }

    public static Optional<ResourceUpdate> resolveResourceUpdate(FluentResourceCollection collection,
        ResourceCreate resourceCreate, List<ClientModel> availableModels) {
        return ResourceParser.resolveResourceUpdate(collection, resourceCreate, availableModels);
    }

    static Optional<ResourceRefresh> resolveResourceRefresh(FluentResourceCollection collection,
        ResourceCreate resourceCreate) {
        return ResourceParser.resolveResourceRefresh(collection, resourceCreate);
    }

    public static Optional<ResourceDelete> resolveResourceDelete(FluentResourceCollection collection,
        ResourceCreate resourceCreate) {
        return ResourceParser.resolveResourceDelete(collection, resourceCreate);
    }

    public static Optional<ResourceActions> resourceResourceActions(FluentResourceCollection collection,
        ResourceCreate resourceCreate) {
        return ResourceParser.resourceResourceActions(collection, resourceCreate);
    }
}
