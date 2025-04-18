// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.clientgenerator.core.clientinitialization;

import azure.clientgenerator.core.clientinitialization.implementation.MultipleParamsClientImpl;
import azure.clientgenerator.core.clientinitialization.models.Input;
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

/**
 * Initializes a new instance of the synchronous MultipleParamsClient type.
 */
@ServiceClient(builder = MultipleParamsClientBuilder.class)
public final class MultipleParamsClient {
    @Generated
    private final MultipleParamsClientImpl serviceClient;

    /**
     * Initializes an instance of MultipleParamsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    MultipleParamsClient(MultipleParamsClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The withQuery operation.
     * 
     * @param id The id parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryWithResponse(String id, RequestOptions requestOptions) {
        return this.serviceClient.withQueryWithResponse(id, requestOptions);
    }

    /**
     * The withBody operation.
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
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBodyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withBodyWithResponse(body, requestOptions);
    }

    /**
     * The withQuery operation.
     * 
     * @param id The id parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQuery(String id) {
        // Generated convenience method for withQueryWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withQueryWithResponse(id, requestOptions).getValue();
    }

    /**
     * The withBody operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withBody(Input body) {
        // Generated convenience method for withBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withBodyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
