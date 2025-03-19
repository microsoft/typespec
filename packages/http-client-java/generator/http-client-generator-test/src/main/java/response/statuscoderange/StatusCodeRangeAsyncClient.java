// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package response.statuscoderange;

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
import reactor.core.publisher.Mono;
import response.statuscoderange.implementation.StatusCodeRangeClientImpl;

/**
 * Initializes a new instance of the asynchronous StatusCodeRangeClient type.
 */
@ServiceClient(builder = StatusCodeRangeClientBuilder.class, isAsync = true)
public final class StatusCodeRangeAsyncClient {
    @Generated
    private final StatusCodeRangeClientImpl serviceClient;

    /**
     * Initializes an instance of StatusCodeRangeAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    StatusCodeRangeAsyncClient(StatusCodeRangeClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * int
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<BinaryData>> errorResponseStatusCodeInRangeWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.errorResponseStatusCodeInRangeWithResponseAsync(requestOptions);
    }

    /**
     * The errorResponseStatusCode404 operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * int
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<BinaryData>> errorResponseStatusCode404WithResponse(RequestOptions requestOptions) {
        return this.serviceClient.errorResponseStatusCode404WithResponseAsync(requestOptions);
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Integer> errorResponseStatusCodeInRange() {
        // Generated convenience method for errorResponseStatusCodeInRangeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return errorResponseStatusCodeInRangeWithResponse(requestOptions).flatMap(FluxUtil::toMono)
            .map(protocolMethodData -> protocolMethodData.toString());
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Integer> errorResponseStatusCode404() {
        // Generated convenience method for errorResponseStatusCode404WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return errorResponseStatusCode404WithResponse(requestOptions).flatMap(FluxUtil::toMono)
            .map(protocolMethodData -> protocolMethodData.toString());
    }
}
