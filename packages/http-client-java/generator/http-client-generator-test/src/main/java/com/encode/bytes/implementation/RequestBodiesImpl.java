// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.encode.bytes.implementation;

import com.azure.core.annotation.BodyParam;
import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.HeaderParam;
import com.azure.core.annotation.Host;
import com.azure.core.annotation.HostParam;
import com.azure.core.annotation.Post;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceInterface;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.annotation.UnexpectedResponseExceptionType;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.core.util.FluxUtil;
import reactor.core.publisher.Mono;

/**
 * An instance of this class provides access to all the operations defined in RequestBodies.
 */
public final class RequestBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RequestBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * Initializes an instance of RequestBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RequestBodiesImpl(BytesClientImpl client) {
        this.service
            = RestProxy.create(RequestBodiesService.class, client.getHttpPipeline(), client.getSerializerAdapter());
        this.client = client;
    }

    /**
     * The interface defining all the services for BytesClientRequestBodies to be used by the proxy service to perform
     * REST calls.
     */
    @Host("{endpoint}")
    @ServiceInterface(name = "BytesClientRequestBo")
    public interface RequestBodiesService {
        @Post("/encode/bytes/body/request/default")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> defaultMethod(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/default")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/octet-stream")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> octetStream(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/octet-stream") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/octet-stream")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> octetStreamSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/octet-stream") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/custom-content-type")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> customContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("image/png") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/custom-content-type")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> customContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("image/png") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/base64")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> base64(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/base64")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> base64Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/base64url")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> base64url(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);

        @Post("/encode/bytes/body/request/base64url")
        @ExpectedResponses({ 204 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> base64urlSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions, Context context);
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> defaultMethodWithResponseAsync(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return FluxUtil.withContext(
            context -> service.defaultMethod(this.client.getEndpoint(), contentType, value, requestOptions, context));
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.defaultMethodSync(this.client.getEndpoint(), contentType, value, requestOptions, Context.NONE);
    }

    /**
     * The octetStream operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> octetStreamWithResponseAsync(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/octet-stream";
        return FluxUtil.withContext(
            context -> service.octetStream(this.client.getEndpoint(), contentType, value, requestOptions, context));
    }

    /**
     * The octetStream operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> octetStreamWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/octet-stream";
        return service.octetStreamSync(this.client.getEndpoint(), contentType, value, requestOptions, Context.NONE);
    }

    /**
     * The customContentType operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> customContentTypeWithResponseAsync(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "image/png";
        return FluxUtil.withContext(context -> service.customContentType(this.client.getEndpoint(), contentType, value,
            requestOptions, context));
    }

    /**
     * The customContentType operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> customContentTypeWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "image/png";
        return service.customContentTypeSync(this.client.getEndpoint(), contentType, value, requestOptions,
            Context.NONE);
    }

    /**
     * The base64 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> base64WithResponseAsync(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return FluxUtil.withContext(
            context -> service.base64(this.client.getEndpoint(), contentType, value, requestOptions, context));
    }

    /**
     * The base64 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64WithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.base64Sync(this.client.getEndpoint(), contentType, value, requestOptions, Context.NONE);
    }

    /**
     * The base64url operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Url
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> base64urlWithResponseAsync(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return FluxUtil.withContext(
            context -> service.base64url(this.client.getEndpoint(), contentType, value, requestOptions, context));
    }

    /**
     * The base64url operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Url
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.base64urlSync(this.client.getEndpoint(), contentType, value, requestOptions, Context.NONE);
    }
}
