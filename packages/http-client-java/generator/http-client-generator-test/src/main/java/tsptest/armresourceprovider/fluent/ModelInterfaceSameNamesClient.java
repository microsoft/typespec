// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armresourceprovider.fluent;

import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;
import tsptest.armresourceprovider.fluent.models.ModelInterfaceSameNameInner;

/**
 * An instance of this class provides access to all the operations defined in ModelInterfaceSameNamesClient.
 */
public interface ModelInterfaceSameNamesClient {
    /**
     * Get a ModelInterfaceDifferentName.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param modelInterfaceDifferentNameName The name of the ModelInterfaceDifferentName.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ModelInterfaceDifferentName along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<ModelInterfaceSameNameInner> getByResourceGroupWithResponse(String resourceGroupName,
        String modelInterfaceDifferentNameName, Context context);

    /**
     * Get a ModelInterfaceDifferentName.
     * 
     * @param resourceGroupName The name of the resource group. The name is case insensitive.
     * @param modelInterfaceDifferentNameName The name of the ModelInterfaceDifferentName.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a ModelInterfaceDifferentName.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    ModelInterfaceSameNameInner getByResourceGroup(String resourceGroupName, String modelInterfaceDifferentNameName);
}
