// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armresourceprovider.models;

import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;

/**
 * Resource collection API of ChildExtensionResourceInterfaces.
 */
public interface ChildExtensionResourceInterfaces {
    /**
     * Get a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildExtensionResource along with {@link Response}.
     */
    Response<ChildExtensionResource> getWithResponse(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName, Context context);

    /**
     * Get a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildExtensionResource.
     */
    ChildExtensionResource get(String resourceUri, String topLevelArmResourceName, String childExtensionResourceName);

    /**
     * Delete a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void delete(String resourceUri, String topLevelArmResourceName, String childExtensionResourceName);

    /**
     * Delete a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void delete(String resourceUri, String topLevelArmResourceName, String childExtensionResourceName, Context context);

    /**
     * List ChildExtensionResource resources by TopLevelArmResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a ChildExtensionResource list operation as paginated response with {@link PagedIterable}.
     */
    PagedIterable<ChildExtensionResource> listByTopLevelArmResource(String resourceUri, String topLevelArmResourceName);

    /**
     * List ChildExtensionResource resources by TopLevelArmResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response of a ChildExtensionResource list operation as paginated response with {@link PagedIterable}.
     */
    PagedIterable<ChildExtensionResource> listByTopLevelArmResource(String resourceUri, String topLevelArmResourceName,
        Context context);

    /**
     * Get a ChildExtensionResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildExtensionResource along with {@link Response}.
     */
    ChildExtensionResource getById(String id);

    /**
     * Get a ChildExtensionResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ChildExtensionResource along with {@link Response}.
     */
    Response<ChildExtensionResource> getByIdWithResponse(String id, Context context);

    /**
     * Delete a ChildExtensionResource.
     * 
     * @param id the resource ID.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteById(String id);

    /**
     * Delete a ChildExtensionResource.
     * 
     * @param id the resource ID.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    void deleteByIdWithResponse(String id, Context context);

    /**
     * Begins definition for a new ChildExtensionResource resource.
     * 
     * @param name resource name.
     * @return the first stage of the new ChildExtensionResource definition.
     */
    ChildExtensionResource.DefinitionStages.Blank define(String name);
}
