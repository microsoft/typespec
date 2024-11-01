// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.versioning.renamedfrom.implementation;

import com.azure.core.annotation.BodyParam;
import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.HeaderParam;
import com.azure.core.annotation.Host;
import com.azure.core.annotation.HostParam;
import com.azure.core.annotation.Post;
import com.azure.core.annotation.QueryParam;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceInterface;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.annotation.UnexpectedResponseExceptionType;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.UserAgentPolicy;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.core.util.FluxUtil;
import com.azure.core.util.serializer.JacksonAdapter;
import com.azure.core.util.serializer.SerializerAdapter;
import com.versioning.renamedfrom.RenamedFromServiceVersion;
import com.versioning.renamedfrom.models.Versions;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the RenamedFromClient type.
 */
public final class RenamedFromClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RenamedFromClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Need to be set as 'v1' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
    }

    /**
     * Service version.
     */
    private final RenamedFromServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RenamedFromServiceVersion getServiceVersion() {
        return this.serviceVersion;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The serializer to serialize an object into a string.
     */
    private final SerializerAdapter serializerAdapter;

    /**
     * Gets The serializer to serialize an object into a string.
     * 
     * @return the serializerAdapter value.
     */
    public SerializerAdapter getSerializerAdapter() {
        return this.serializerAdapter;
    }

    /**
     * The NewInterfacesImpl object to access its operations.
     */
    private final NewInterfacesImpl newInterfaces;

    /**
     * Gets the NewInterfacesImpl object to access its operations.
     * 
     * @return the NewInterfacesImpl object.
     */
    public NewInterfacesImpl getNewInterfaces() {
        return this.newInterfaces;
    }

    /**
     * Initializes an instance of RenamedFromClient client.
     * 
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public RenamedFromClientImpl(String endpoint, Versions version, RenamedFromServiceVersion serviceVersion) {
        this(new HttpPipelineBuilder().policies(new UserAgentPolicy(), new RetryPolicy()).build(),
            JacksonAdapter.createDefaultSerializerAdapter(), endpoint, version, serviceVersion);
    }

    /**
     * Initializes an instance of RenamedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public RenamedFromClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        RenamedFromServiceVersion serviceVersion) {
        this(httpPipeline, JacksonAdapter.createDefaultSerializerAdapter(), endpoint, version, serviceVersion);
    }

    /**
     * Initializes an instance of RenamedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param serializerAdapter The serializer to serialize an object into a string.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public RenamedFromClientImpl(HttpPipeline httpPipeline, SerializerAdapter serializerAdapter, String endpoint,
        Versions version, RenamedFromServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.serializerAdapter = serializerAdapter;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.newInterfaces = new NewInterfacesImpl(this);
        this.service = RestProxy.create(RenamedFromClientService.class, this.httpPipeline, this.getSerializerAdapter());
    }

    /**
     * The interface defining all the services for RenamedFromClient to be used by the proxy service to perform REST
     * calls.
     */
    @Host("{endpoint}/versioning/renamed-from/api-version:{version}")
    @ServiceInterface(name = "RenamedFromClient")
    public interface RenamedFromClientService {
        @Post("/test")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<BinaryData>> newOp(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @QueryParam("newQuery") String newQuery, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions, Context context);

        @Post("/test")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<BinaryData> newOpSync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @QueryParam("newQuery") String newQuery, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions, Context context);
    }

    /**
     * The newOp operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<BinaryData>> newOpWithResponseAsync(String newQuery, BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return FluxUtil.withContext(context -> service.newOp(this.getEndpoint(), this.getVersion(), newQuery,
            contentType, accept, body, requestOptions, context));
    }

    /**
     * The newOp operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> newOpWithResponse(String newQuery, BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.newOpSync(this.getEndpoint(), this.getVersion(), newQuery, contentType, accept, body,
            requestOptions, Context.NONE);
    }
}
