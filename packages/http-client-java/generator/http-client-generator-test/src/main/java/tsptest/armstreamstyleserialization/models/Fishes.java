// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armstreamstyleserialization.models;

import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;
import tsptest.armstreamstyleserialization.fluent.models.FishInner;

/**
 * Resource collection API of Fishes.
 */
public interface Fishes {
    /**
     * The getModel operation.
     * 
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ErrorException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    Response<Fish> getModelWithResponse(Context context);

    /**
     * The getModel operation.
     * 
     * @throws ErrorException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    Fish getModel();

    /**
     * The putModel operation.
     * 
     * @param fish The fish parameter.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ErrorMinException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    Response<Fish> putModelWithResponse(FishInner fish, Context context);

    /**
     * The putModel operation.
     * 
     * @param fish The fish parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ErrorMinException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    Fish putModel(FishInner fish);

    /**
     * The getOutputOnlyModel operation.
     * 
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic OutputOnlyModel along with {@link Response}.
     */
    Response<OutputOnlyModel> getOutputOnlyModelWithResponse(Context context);

    /**
     * The getOutputOnlyModel operation.
     * 
     * @throws com.azure.core.management.exception.ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic OutputOnlyModel.
     */
    OutputOnlyModel getOutputOnlyModel();
}
