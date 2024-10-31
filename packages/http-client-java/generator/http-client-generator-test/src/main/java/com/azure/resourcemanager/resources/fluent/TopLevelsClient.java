// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.azure.resourcemanager.resources.fluent;

import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.management.polling.PollResult;
import com.azure.core.util.Context;
import com.azure.core.util.polling.SyncPoller;
import com.azure.resourcemanager.resources.fluent.models.TopLevelTrackedResourceInner;
import com.azure.resourcemanager.resources.models.NotificationDetails;

/**
 * An instance of this class provides access to all the operations defined in TopLevelsClient.
 */
public interface TopLevelsClient {
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<TopLevelTrackedResourceInner> getByResourceGroupWithResponse(String resourceGroupName,
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    TopLevelTrackedResourceInner getByResourceGroup(String resourceGroupName, String topLevelTrackedResourceName);

    /**
     * Create a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of concrete tracked resource types can be created by aliasing this
     * type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<TopLevelTrackedResourceInner>, TopLevelTrackedResourceInner> beginCreateOrReplace(
        String resourceGroupName, String topLevelTrackedResourceName, TopLevelTrackedResourceInner resource);

    /**
     * Create a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of concrete tracked resource types can be created by aliasing this
     * type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<TopLevelTrackedResourceInner>, TopLevelTrackedResourceInner> beginCreateOrReplace(
        String resourceGroupName, String topLevelTrackedResourceName, TopLevelTrackedResourceInner resource,
        Context context);

    /**
     * Create a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    TopLevelTrackedResourceInner createOrReplace(String resourceGroupName, String topLevelTrackedResourceName,
        TopLevelTrackedResourceInner resource);

    /**
     * Create a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param resource Resource create parameters.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    TopLevelTrackedResourceInner createOrReplace(String resourceGroupName, String topLevelTrackedResourceName,
        TopLevelTrackedResourceInner resource, Context context);

    /**
     * Update a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of concrete tracked resource types can be created by aliasing this
     * type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<TopLevelTrackedResourceInner>, TopLevelTrackedResourceInner> beginUpdate(
        String resourceGroupName, String topLevelTrackedResourceName, TopLevelTrackedResourceInner properties);

    /**
     * Update a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of concrete tracked resource types can be created by aliasing this
     * type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<TopLevelTrackedResourceInner>, TopLevelTrackedResourceInner> beginUpdate(
        String resourceGroupName, String topLevelTrackedResourceName, TopLevelTrackedResourceInner properties,
        Context context);

    /**
     * Update a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    TopLevelTrackedResourceInner update(String resourceGroupName, String topLevelTrackedResourceName,
        TopLevelTrackedResourceInner properties);

    /**
     * Update a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param properties The resource properties to be updated.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return concrete tracked resource types can be created by aliasing this type using a specific property type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    TopLevelTrackedResourceInner update(String resourceGroupName, String topLevelTrackedResourceName,
        TopLevelTrackedResourceInner properties, Context context);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of long-running operation.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<Void>, Void> beginDelete(String resourceGroupName, String topLevelTrackedResourceName);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link SyncPoller} for polling of long-running operation.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    SyncPoller<PollResult<Void>, Void> beginDelete(String resourceGroupName, String topLevelTrackedResourceName,
        Context context);

    /**
     * Delete a TopLevelTrackedResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelTrackedResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    void delete(String resourceGroupName, String topLevelTrackedResourceName);

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
    @ServiceMethod(returns = ReturnType.SINGLE)
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
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<TopLevelTrackedResourceInner> listByResourceGroup(String resourceGroupName);

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
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<TopLevelTrackedResourceInner> listByResourceGroup(String resourceGroupName, Context context);

    /**
     * List TopLevelTrackedResource resources by subscription ID.
     * 
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a TopLevelTrackedResource list operation as paginated response with
     * {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<TopLevelTrackedResourceInner> list();

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
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<TopLevelTrackedResourceInner> list(Context context);

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
    @ServiceMethod(returns = ReturnType.SINGLE)
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    void actionSync(String resourceGroupName, String topLevelTrackedResourceName, NotificationDetails body);
}
