// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.arm;

import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;

import java.util.Arrays;
import java.util.Objects;
import java.util.Optional;

public class ErrorClientModel {

    private ErrorClientModel(){

    }

    public static final ClientModel MANAGEMENT_ERROR = new ClientModel.Builder()
        .name(FluentType.MANAGEMENT_ERROR.getName())
        .packageName("com.azure.core.management.exception")
        .properties(Arrays.asList(
            new ClientModelProperty.Builder()
                .name("code")
                .serializedName("code")
                .description("The error code parsed from the body of the http error response.")
                .readOnly(true)
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .build(),
            new ClientModelProperty.Builder()
                .name("message")
                .serializedName("message")
                .description("The error message parsed from the body of the http error response.")
                .readOnly(true)
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .build(),
            new ClientModelProperty.Builder()
                .name("target")
                .serializedName("target")
                .description("The target of the error.")
                .readOnly(true)
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .build(),
            new ClientModelProperty.Builder()
                .name("details")
                .serializedName("details")
                .description("Details for the error.")
                .readOnly(true)
                .wireType(new ListType(FluentType.MANAGEMENT_ERROR))
                .clientType(new ListType(FluentType.MANAGEMENT_ERROR))
                .build(),
            new ClientModelProperty.Builder()
                .name("additionalInfo")
                .serializedName("additionalInfo")
                .description("Additional info for the error.")
                .readOnly(true)
                .wireType(new ListType(FluentType.ADDITIONAL_INFO))
                .clientType(new ListType(FluentType.ADDITIONAL_INFO))
                .build()
        )).build();

    private static final ClientModel ADDITIONAL_INFO = new ClientModel.Builder()
        .name(FluentType.ADDITIONAL_INFO.getName())
        .packageName("com.azure.core.management.exception")
        .properties(Arrays.asList(
            new ClientModelProperty.Builder()
                .name("type")
                .serializedName("type")
                .description("The type of additional info.")
                .readOnly(true)
                .wireType(ClassType.STRING)
                .clientType(ClassType.STRING)
                .build(),
            new ClientModelProperty.Builder()
                .name("info")
                .serializedName("info")
                .description("The additional info.")
                .readOnly(true)
                .wireType(ClassType.OBJECT)
                .clientType(ClassType.OBJECT)
                .build()
        )).build();

    public static Optional<ClientModel> getErrorClientModel(String modelName) {
        Optional<ClientModel> result = Optional.empty();
        if (Objects.equals(modelName, FluentType.MANAGEMENT_ERROR.getName())) {
            result = Optional.of(MANAGEMENT_ERROR);
        } else if (Objects.equals(modelName, FluentType.ADDITIONAL_INFO.getName())) {
            result = Optional.of(ADDITIONAL_INFO);
        }
        return result;
    }
}
