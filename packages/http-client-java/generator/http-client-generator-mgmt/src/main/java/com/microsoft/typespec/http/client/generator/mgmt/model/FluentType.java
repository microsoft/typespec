// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;

public class FluentType {

    public static final ClassType RESOURCE
        = new ClassType.Builder().packageName("com.azure.core.management").name("Resource").build();
    public static final ClassType PROXY_RESOURCE
        = new ClassType.Builder().packageName("com.azure.core.management").name("ProxyResource").build();
    public static final ClassType SUB_RESOURCE
        = new ClassType.Builder().packageName("com.azure.core.management").name("SubResource").build();

    public static final ClassType MANAGEMENT_EXCEPTION
        = new ClassType.Builder().packageName("com.azure.core.management.exception")
            .name("ManagementException")
            .build();
    public static final ClassType MANAGEMENT_ERROR
        = new ClassType.Builder().packageName("com.azure.core.management.exception").name("ManagementError").build();

    public static final ClassType AZURE_PROFILE
        = new ClassType.Builder().packageName("com.azure.core.management.profile").name("AzureProfile").build();

    public static final ClassType REGION
        = new ClassType.Builder().packageName("com.azure.core.management").name("Region").build();

    public static final ClassType SYSTEM_DATA
        = new ClassType.Builder().packageName("com.azure.core.management").name("SystemData").build();

    public static final ClassType AZURE_RESOURCE_MANAGER
        = new ClassType.Builder().packageName("com.azure.resourcemanager").name("AzureResourceManager").build();

    public static final ClassType ADDITIONAL_INFO
        = new ClassType.Builder().packageName("com.azure.core.management.exception").name("AdditionalInfo").build();

    private FluentType() {
    }

    public static GenericType innerSupportsGet(IType typeArgument) {
        return new GenericType("com.azure.resourcemanager.resources.fluentcore.collection", "InnerSupportsGet",
            typeArgument);
    }

    public static GenericType innerSupportsList(IType typeArgument) {
        return new GenericType("com.azure.resourcemanager.resources.fluentcore.collection", "InnerSupportsListing",
            typeArgument);
    }

    public static GenericType innerSupportsDelete(IType typeArgument) {
        return new GenericType("com.azure.resourcemanager.resources.fluentcore.collection", "InnerSupportsDelete",
            typeArgument);
    }

    public static boolean nonResourceType(ObjectSchema compositeType) {
        return nonResourceType(Utils.getJavaName(compositeType));
    }

    public static boolean nonResourceType(ClassType modelType) {
        return !(RESOURCE.equals(modelType) || PROXY_RESOURCE.equals(modelType) || SUB_RESOURCE.equals(modelType));
    }

    public static boolean nonResourceType(String modelName) {
        return !(RESOURCE.getName().equals(modelName)
            || PROXY_RESOURCE.getName().equals(modelName)
            || SUB_RESOURCE.getName().equals(modelName));
    }

    public static boolean nonSystemData(ClassType modelType) {
        return nonSystemData(modelType.getName());
    }

    public static boolean nonSystemData(String modelName) {
        return !SYSTEM_DATA.getName().equals(modelName);
    }

    public static boolean nonManagementError(ClassType modelType) {
        return nonManagementError(modelType.getName());
    }

    public static boolean nonManagementError(String modelName) {
        return !MANAGEMENT_ERROR.getName().equals(modelName);
    }
}
