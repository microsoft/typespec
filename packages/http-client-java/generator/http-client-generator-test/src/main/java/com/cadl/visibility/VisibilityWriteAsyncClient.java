// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.visibility;

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
import com.azure.core.util.FluxUtil;
import com.cadl.visibility.implementation.VisibilityWritesImpl;
import com.cadl.visibility.models.Dog;
import com.cadl.visibility.models.WriteDog;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the asynchronous VisibilityClient type.
 */
@ServiceClient(builder = VisibilityClientBuilder.class, isAsync = true)
public final class VisibilityWriteAsyncClient {
    @Generated
    private final VisibilityWritesImpl serviceClient;

    /**
     * Initializes an instance of VisibilityWriteAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    VisibilityWriteAsyncClient(VisibilityWritesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The create operation.
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
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     secretName: String (Required)
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param dog The dog parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<BinaryData>> createWithResponse(BinaryData dog, RequestOptions requestOptions) {
        return this.serviceClient.createWithResponseAsync(dog, requestOptions);
    }

    /**
     * The create operation.
     * 
     * @param dog The dog parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Dog> create(WriteDog dog) {
        // Generated convenience method for createWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createWithResponse(BinaryData.fromObject(dog), requestOptions).flatMap(FluxUtil::toMono)
            .map(protocolMethodData -> protocolMethodData.toObject(Dog.class));
    }
}
