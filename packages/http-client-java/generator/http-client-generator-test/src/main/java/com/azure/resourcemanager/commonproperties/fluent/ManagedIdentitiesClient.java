// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.azure.resourcemanager.commonproperties.fluent;

import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;
import com.azure.resourcemanager.commonproperties.fluent.models.ManagedIdentityTrackedResourceInner;

/**
 * An instance of this class provides access to all the operations defined in ManagedIdentitiesClient.
 */
public interface ManagedIdentitiesClient {
    /**
     * Get a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ManagedIdentityTrackedResource along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ManagedIdentityTrackedResourceInner> getByResourceGroupWithResponse(String resourceGroupName,
        String managedIdentityTrackedResourceName, Context context);

    /**
     * Get a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ManagedIdentityTrackedResource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ManagedIdentityTrackedResourceInner getByResourceGroup(String resourceGroupName,
        String managedIdentityTrackedResourceName);

    /**
     * Create a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type along
     * with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ManagedIdentityTrackedResourceInner> createWithSystemAssignedWithResponse(String resourceGroupName,
        String managedIdentityTrackedResourceName, ManagedIdentityTrackedResourceInner resource, Context context);

    /**
     * Create a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ManagedIdentityTrackedResourceInner createWithSystemAssigned(String resourceGroupName,
        String managedIdentityTrackedResourceName, ManagedIdentityTrackedResourceInner resource);

    /**
     * Update a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type along
     * with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ManagedIdentityTrackedResourceInner> updateWithUserAssignedAndSystemAssignedWithResponse(
        String resourceGroupName, String managedIdentityTrackedResourceName,
        ManagedIdentityTrackedResourceInner properties, Context context);

    /**
     * Update a ManagedIdentityTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param managedIdentityTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ManagedIdentityTrackedResourceInner updateWithUserAssignedAndSystemAssigned(String resourceGroupName,
        String managedIdentityTrackedResourceName, ManagedIdentityTrackedResourceInner properties);
}
