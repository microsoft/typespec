// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.azure.resourcemanager.models.resources.models;

import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;

/**
 * Resource collection API of TopLevelTrackedResources.
 */
public interface TopLevelTrackedResources {
    /**
     * Get a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a TopLevelTrackedResource along with {@link Response}.
     */
    Response<TopLevelTrackedResource> getByResourceGroupWithResponse(String resourceGroupName,
        String topLevelTrackedResourceName, Context context);

    /**
     * Get a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a TopLevelTrackedResource.
     */
    TopLevelTrackedResource getByResourceGroup(String resourceGroupName, String topLevelTrackedResourceName);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteByResourceGroup(String resourceGroupName, String topLevelTrackedResourceName);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void delete(String resourceGroupName, String topLevelTrackedResourceName, Context context);

    /**
     * List TopLevelTrackedResource resources by resource group.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a TopLevelTrackedResource list operation as paginated response with
     * {@link PagedIterable}.
     */
    PagedIterable<TopLevelTrackedResource> listByResourceGroup(String resourceGroupName);

    /**
     * List TopLevelTrackedResource resources by resource group.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a TopLevelTrackedResource list operation as paginated response with
     * {@link PagedIterable}.
     */
    PagedIterable<TopLevelTrackedResource> listByResourceGroup(String resourceGroupName, Context context);

    /**
     * List TopLevelTrackedResource resources by subscription ID.
     * 
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a TopLevelTrackedResource list operation as paginated response with
     * {@link PagedIterable}.
     */
    PagedIterable<TopLevelTrackedResource> list();

    /**
     * List TopLevelTrackedResource resources by subscription ID.
     * 
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a TopLevelTrackedResource list operation as paginated response with
     * {@link PagedIterable}.
     */
    PagedIterable<TopLevelTrackedResource> list(Context context);

    /**
     * A synchronous resource action that returns no content.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param body The content of the action request.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    Response<Void> actionSyncWithResponse(String resourceGroupName, String topLevelTrackedResourceName,
        NotificationDetails body, Context context);

    /**
     * A synchronous resource action that returns no content.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param body The content of the action request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void actionSync(String resourceGroupName, String topLevelTrackedResourceName, NotificationDetails body);

    /**
     * Get a TopLevelTrackedResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a TopLevelTrackedResource along with {@link Response}.
     */
    TopLevelTrackedResource getById(String id);

    /**
     * Get a TopLevelTrackedResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a TopLevelTrackedResource along with {@link Response}.
     */
    Response<TopLevelTrackedResource> getByIdWithResponse(String id, Context context);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteById(String id);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteByIdWithResponse(String id, Context context);

    /**
     * Begins definition for a new TopLevelTrackedResource resource.
     * 
     * @param name resource name.
     * @return the first stage of the new TopLevelTrackedResource definition.
     */
    TopLevelTrackedResource.DefinitionStages.Blank define(String name);
}
