// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.operationtemplates.models;

import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;

/**
 * Resource collection API of CheckNameAvailabilities.
 */
public interface CheckNameAvailabilities {
    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response}.
     */
    Response<CheckNameAvailabilityResponse> checkGlobalWithResponse(CheckNameAvailabilityRequest body, Context context);

    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result.
     */
    CheckNameAvailabilityResponse checkGlobal(CheckNameAvailabilityRequest body);

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response}.
     */
    Response<CheckNameAvailabilityResponse> checkLocalWithResponse(String location, CheckNameAvailabilityRequest body,
        Context context);

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result.
     */
    CheckNameAvailabilityResponse checkLocal(String location, CheckNameAvailabilityRequest body);
}
