// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armresourceprovider.models;

import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;

/**
 * Resource collection API of ChildResourcesInterfaces.
 */
public interface ChildResourcesInterfaces {
    /**
     * Get a ChildResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildResource along with {@link Response}.
     */
    Response<ChildResource> getWithResponse(String resourceGroupName, String topLevelArmResourceName,
        String childResourceName, Context context);

    /**
     * Get a ChildResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildResource.
     */
    ChildResource get(String resourceGroupName, String topLevelArmResourceName, String childResourceName);

    /**
     * Delete a ChildResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void delete(String resourceGroupName, String topLevelArmResourceName, String childResourceName);

    /**
     * Delete a ChildResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void delete(String resourceGroupName, String topLevelArmResourceName, String childResourceName, Context context);

    /**
     * List ChildResource resources by TopLevelArmResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged collection of ChildResource items as paginated response with {@link PagedIterable}.
     */
    PagedIterable<ChildResource> listByTopLevelArmResource(String resourceGroupName, String topLevelArmResourceName);

    /**
     * List ChildResource resources by TopLevelArmResource.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged collection of ChildResource items as paginated response with {@link PagedIterable}.
     */
    PagedIterable<ChildResource> listByTopLevelArmResource(String resourceGroupName, String topLevelArmResourceName,
        Context context);

    /**
     * A long-running resource action.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void actionWithoutBody(String resourceGroupName, String topLevelArmResourceName, String childResourceName);

    /**
     * A long-running resource action.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childResourceName ChildResources.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void actionWithoutBody(String resourceGroupName, String topLevelArmResourceName, String childResourceName,
        Context context);

    /**
     * Get a ChildResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildResource along with {@link Response}.
     */
    ChildResource getById(String id);

    /**
     * Get a ChildResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildResource along with {@link Response}.
     */
    Response<ChildResource> getByIdWithResponse(String id, Context context);

    /**
     * Delete a ChildResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteById(String id);

    /**
     * Delete a ChildResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteByIdWithResponse(String id, Context context);

    /**
     * Begins definition for a new ChildResource resource.
     * 
     * @param name resource name.
     * @return the first stage of the new ChildResource definition.
     */
    ChildResource.DefinitionStages.Blank define(String name);
}
