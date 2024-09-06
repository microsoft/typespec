// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.specialheaders.conditionalrequest;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceClient;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.util.DateTimeRfc1123;
import com.azure.core.util.FluxUtil;
import com.specialheaders.conditionalrequest.implementation.ConditionalRequestClientImpl;
import java.time.OffsetDateTime;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the asynchronous ConditionalRequestClient type.
 */
@ServiceClient(builder = ConditionalRequestClientBuilder.class, isAsync = true)
public final class ConditionalRequestAsyncClient {
    @Generated
    private final ConditionalRequestClientImpl serviceClient;

    /**
     * Initializes an instance of ConditionalRequestAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    ConditionalRequestAsyncClient(ConditionalRequestClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Check when only If-Match in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Match</td><td>String</td><td>No</td><td>The request should only proceed if an entity matches this
     * string.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
    public Mono<Response<Void>> postIfMatchWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.postIfMatchWithResponseAsync(requestOptions);
    }

    /**
     * Check when only If-None-Match in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-None-Match</td><td>String</td><td>No</td><td>The request should only proceed if no entity matches this
     * string.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
    public Mono<Response<Void>> postIfNoneMatchWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.postIfNoneMatchWithResponseAsync(requestOptions);
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Modified-Since</td><td>OffsetDateTime</td><td>No</td><td>A timestamp indicating the last modified time
     * of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * been modified since the specified time.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
    public Mono<Response<Void>> headIfModifiedSinceWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.headIfModifiedSinceWithResponseAsync(requestOptions);
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Unmodified-Since</td><td>OffsetDateTime</td><td>No</td><td>A timestamp indicating the last modified
     * time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * not been modified since the specified time.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
    public Mono<Response<Void>> postIfUnmodifiedSinceWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.postIfUnmodifiedSinceWithResponseAsync(requestOptions);
    }

    /**
     * Check when only If-Match in header is defined.
     * 
     * @param ifMatch The request should only proceed if an entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> postIfMatch(String ifMatch) {
        // Generated convenience method for postIfMatchWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (ifMatch != null) {
            requestOptions.setHeader(HttpHeaderName.IF_MATCH, ifMatch);
        }
        return postIfMatchWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-Match in header is defined.
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
    public Mono<Void> postIfMatch() {
        // Generated convenience method for postIfMatchWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return postIfMatchWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @param ifNoneMatch The request should only proceed if no entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> postIfNoneMatch(String ifNoneMatch) {
        // Generated convenience method for postIfNoneMatchWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (ifNoneMatch != null) {
            requestOptions.setHeader(HttpHeaderName.IF_NONE_MATCH, ifNoneMatch);
        }
        return postIfNoneMatchWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-None-Match in header is defined.
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
    public Mono<Void> postIfNoneMatch() {
        // Generated convenience method for postIfNoneMatchWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return postIfNoneMatchWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * 
     * @param ifModifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * been modified since the specified time.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> headIfModifiedSince(OffsetDateTime ifModifiedSince) {
        // Generated convenience method for headIfModifiedSinceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (ifModifiedSince != null) {
            requestOptions.setHeader(HttpHeaderName.IF_MODIFIED_SINCE,
                String.valueOf(new DateTimeRfc1123(ifModifiedSince)));
        }
        return headIfModifiedSinceWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-Modified-Since in header is defined.
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
    public Mono<Void> headIfModifiedSince() {
        // Generated convenience method for headIfModifiedSinceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return headIfModifiedSinceWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * 
     * @param ifUnmodifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * not been modified since the specified time.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> postIfUnmodifiedSince(OffsetDateTime ifUnmodifiedSince) {
        // Generated convenience method for postIfUnmodifiedSinceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (ifUnmodifiedSince != null) {
            requestOptions.setHeader(HttpHeaderName.IF_UNMODIFIED_SINCE,
                String.valueOf(new DateTimeRfc1123(ifUnmodifiedSince)));
        }
        return postIfUnmodifiedSinceWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
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
    public Mono<Void> postIfUnmodifiedSince() {
        // Generated convenience method for postIfUnmodifiedSinceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return postIfUnmodifiedSinceWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }
}
