// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armresourceprovider.fluent;

import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;
import tsptest.armresourceprovider.fluent.models.ChildExtensionResourceInner;
import tsptest.armresourceprovider.models.ChildExtensionResourceUpdate;

/**
 * An instance of this class provides access to all the operations defined in ChildExtensionResourceInterfacesClient.
 */
public interface ChildExtensionResourceInterfacesClient {
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ChildExtensionResourceInner> getWithResponse(String resourceUri, String topLevelArmResourceName,
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    ChildExtensionResourceInner get(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName);

    /**
     * Create a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param resource Resource create parameters.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return extensionResource of Top Level Arm Resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ChildExtensionResourceInner createOrUpdate(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName, ChildExtensionResourceInner resource);

    /**
     * Create a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param resource Resource create parameters.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return extensionResource of Top Level Arm Resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ChildExtensionResourceInner createOrUpdate(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName, ChildExtensionResourceInner resource, Context context);

    /**
     * Update a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param properties The resource properties to be updated.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return extensionResource of Top Level Arm Resource along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ChildExtensionResourceInner> updateWithResponse(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName, ChildExtensionResourceUpdate properties, Context context);

    /**
     * Update a ChildExtensionResource.
     * 
     * @param resourceUri The fully qualified Azure Resource manager identifier of the resource.
     * @param topLevelArmResourceName arm resource name for path.
     * @param childExtensionResourceName ChildExtensionResources.
     * @param properties The resource properties to be updated.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return extensionResource of Top Level Arm Resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ChildExtensionResourceInner update(String resourceUri, String topLevelArmResourceName,
        String childExtensionResourceName, ChildExtensionResourceUpdate properties);

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
    @ServiceMethod(returns = ReturnType.SINGLE)
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
    @ServiceMethod(returns = ReturnType.SINGLE)
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
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<ChildExtensionResourceInner> listByTopLevelArmResource(String resourceUri,
        String topLevelArmResourceName);

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
    @ServiceMethod(returns = ReturnType.COLLECTION)
    PagedIterable<ChildExtensionResourceInner> listByTopLevelArmResource(String resourceUri,
        String topLevelArmResourceName, Context context);
}
