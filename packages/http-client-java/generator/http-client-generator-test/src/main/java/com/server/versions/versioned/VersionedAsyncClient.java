// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.server.versions.versioned;

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
import com.azure.core.util.FluxUtil;
import com.server.versions.versioned.implementation.VersionedClientImpl;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the asynchronous VersionedClient type.
 */
@ServiceClient(builder = VersionedClientBuilder.class, isAsync = true)
public final class VersionedAsyncClient {
    @Generated
    private final VersionedClientImpl serviceClient;

    /**
     * Initializes an instance of VersionedAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    VersionedAsyncClient(VersionedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> withoutApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withoutApiVersionWithResponseAsync(requestOptions);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> withQueryApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withQueryApiVersionWithResponseAsync(requestOptions);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> withPathApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withPathApiVersionWithResponseAsync(requestOptions);
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> withQueryOldApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withQueryOldApiVersionWithResponseAsync(requestOptions);
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> withoutApiVersion() {
        // Generated convenience method for withoutApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return withoutApiVersionWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> withQueryApiVersion() {
        // Generated convenience method for withQueryApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return withQueryApiVersionWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> withPathApiVersion() {
        // Generated convenience method for withPathApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return withPathApiVersionWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> withQueryOldApiVersion() {
        // Generated convenience method for withQueryOldApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return withQueryOldApiVersionWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }
}
