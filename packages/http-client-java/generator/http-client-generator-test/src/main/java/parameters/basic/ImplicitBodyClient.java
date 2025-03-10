// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package parameters.basic;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceClient;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.util.BinaryData;
import parameters.basic.implementation.ImplicitBodiesImpl;
import parameters.basic.implicitbody.implementation.models.SimpleRequest;

/**
 * Initializes a new instance of the synchronous BasicClient type.
 */
@ServiceClient(builder = BasicClientBuilder.class)
public final class ImplicitBodyClient {
    @Generated
    private final ImplicitBodiesImpl serviceClient;

    /**
     * Initializes an instance of ImplicitBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    ImplicitBodyClient(ImplicitBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The simple operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param simpleRequest The simpleRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> simpleWithResponse(BinaryData simpleRequest, RequestOptions requestOptions) {
        return this.serviceClient.simpleWithResponse(simpleRequest, requestOptions);
    }

    /**
     * The simple operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void simple(String name) {
        // Generated convenience method for simpleWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SimpleRequest simpleRequestObj = new SimpleRequest(name);
        BinaryData simpleRequest = BinaryData.fromObject(simpleRequestObj);
        simpleWithResponse(simpleRequest, requestOptions).getValue();
    }
}
