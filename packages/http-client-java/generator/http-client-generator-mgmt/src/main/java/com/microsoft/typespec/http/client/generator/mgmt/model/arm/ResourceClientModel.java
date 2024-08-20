// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.arm;

import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

public class ResourceClientModel {

    private ResourceClientModel() {

    }

    private static final ClientModel MODEL_SUB_RESOURCE = new ClientModel.Builder()
            .name(ResourceTypeName.SUB_RESOURCE)
            .packageName("com.azure.core.management")
            .properties(Collections.singletonList(
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_ID)
                            .serializedName(ResourceTypeName.FIELD_ID)
                            .description("Fully qualified resource Id for the resource.")
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .build()
            ))
            .build();
    private static final ClientModel MODEL_PROXY_RESOURCE = new ClientModel.Builder()
            .name(ResourceTypeName.PROXY_RESOURCE)
            .packageName("com.azure.core.management")
            .properties(Arrays.asList(
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_ID)
                            .serializedName(ResourceTypeName.FIELD_ID)
                            .description("Fully qualified resource Id for the resource.")
                            .required(true)
                            .readOnly(true)
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .build(),
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_NAME)
                            .serializedName(ResourceTypeName.FIELD_NAME)
                            .description("The name of the resource.")
                            .required(true)
                            .readOnly(true)
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .build(),
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_TYPE)
                            .serializedName(ResourceTypeName.FIELD_TYPE)
                            .description("The type of the resource.")
                            .required(true)
                            .readOnly(true)
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .build()
            ))
            .build();

    private static final ClientModel MODEL_RESOURCE = new ClientModel.Builder()
            .name(ResourceTypeName.RESOURCE)
            .packageName("com.azure.core.management")
            .parentModelName(ResourceTypeName.PROXY_RESOURCE)
            .properties(Arrays.asList(
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_LOCATION)
                            .serializedName(ResourceTypeName.FIELD_LOCATION)
                            .description("The geo-location where the resource lives.")
                            .required(true)
                            .readOnly(false)
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .mutabilities(Arrays.asList(ClientModelProperty.Mutability.CREATE, ClientModelProperty.Mutability.READ))
                            .build(),
                    new ClientModelProperty.Builder()
                            .name(ResourceTypeName.FIELD_TAGS)
                            .serializedName(ResourceTypeName.FIELD_TAGS)
                            .description("Resource tags.")
                            .required(false)
                            .readOnly(false)
                            .wireType(new MapType(ClassType.STRING))
                            .clientType(new MapType(ClassType.STRING))
                            .build()
            ))
            .build();

    public static Optional<ClientModel> getResourceClientModel(String modelName) {
        ClientModel model = null;

        switch (modelName) {
            case ResourceTypeName.RESOURCE:
                model = MODEL_RESOURCE;
                break;

            case ResourceTypeName.PROXY_RESOURCE:
                model = MODEL_PROXY_RESOURCE;
                break;

            case ResourceTypeName.SUB_RESOURCE:
                model = MODEL_SUB_RESOURCE;
                break;
        }

        return Optional.ofNullable(model);
    }
}
