// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

public class ModelNaming {

    public static final String METHOD_SERVICE_CLIENT = "serviceClient";
    public static final String METHOD_INNER_MODEL = "innerModel";
    public static final String METHOD_MANAGER = "manager";

    public static final String MODEL_IMPL_SUFFIX = "Impl";

    public static final String MODEL_PROPERTY_INNER = "innerObject";
    public static final String MODEL_PROPERTY_MANAGER = "serviceManager";

    public static final String COLLECTION_IMPL_SUFFIX = "Impl";

    public static final String COLLECTION_PROPERTY_INNER = "innerClient";
    public static final String COLLECTION_PROPERTY_MANAGER = "serviceManager";

    public static final String MANAGER_PROPERTY_CLIENT = "clientObject";

    public static final String MODEL_FLUENT_INTERFACE_DEFINITION = "Definition";
    public static final String MODEL_FLUENT_INTERFACE_DEFINITION_STAGES = "DefinitionStages";

    public static final String MODEL_FLUENT_INTERFACE_UPDATE = "Update";
    public static final String MODEL_FLUENT_INTERFACE_UPDATE_STAGES = "UpdateStages";

    public static final String METHOD_PARAMETER_NAME_ID = "id";

    public static final String CLASS_RESOURCE_MANAGER_UTILS = "ResourceManagerUtils";

    private ModelNaming() {
    }
}
