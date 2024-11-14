// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.multipleapiversion;

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
import tsptest.multipleapiversion.implementation.SecondClientImpl;
import tsptest.multipleapiversion2.models.Resource2;

/**
 * Initializes a new instance of the synchronous SecondClient type.
 */
@ServiceClient(builder = SecondClientBuilder.class)
public final class SecondClient {
    @Generated
    private final SecondClientImpl serviceClient;

    /**
     * Initializes an instance of SecondClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    SecondClient(SecondClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Resource read operation template.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     name: String (Required)
     *     type: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param name The name parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String name, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(name, requestOptions);
    }

    /**
     * Resource read operation template.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Resource2 get(String name) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(name, requestOptions).getValue().toObject(Resource2.class);
    }
}
