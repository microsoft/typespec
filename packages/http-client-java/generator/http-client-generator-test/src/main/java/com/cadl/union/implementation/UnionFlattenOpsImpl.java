// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.union.implementation;

import com.azure.core.annotation.BodyParam;
import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.Get;
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
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.core.util.FluxUtil;
import com.azure.core.util.polling.PollerFlux;
import com.azure.core.util.polling.PollingStrategyOptions;
import com.azure.core.util.polling.PollOperationDetails;
import com.azure.core.util.polling.SyncPoller;
import com.azure.core.util.serializer.TypeReference;
import com.cadl.union.UnionServiceVersion;
import com.cadl.union.models.Result;
import java.time.Duration;
import reactor.core.publisher.Mono;

/**
 * An instance of this class provides access to all the operations defined in UnionFlattenOps.
 */
public final class UnionFlattenOpsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final UnionFlattenOpsService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of UnionFlattenOpsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    UnionFlattenOpsImpl(UnionClientImpl client) {
        this.service
            = RestProxy.create(UnionFlattenOpsService.class, client.getHttpPipeline(), client.getSerializerAdapter());
        this.client = client;
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public UnionServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    /**
     * The interface defining all the services for UnionClientUnionFlattenOps to be used by the proxy service to perform
     * REST calls.
     */
    @Host("{endpoint}/openai")
    @ServiceInterface(name = "UnionClientUnionFlat")
    public interface UnionFlattenOpsService {
        @Post("/union/send")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> send(@HostParam("endpoint") String endpoint, @QueryParam("id") String id,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest, RequestOptions requestOptions, Context context);

        @Post("/union/send")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @QueryParam("id") String id,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest, RequestOptions requestOptions, Context context);

        @Post("/union/send-long")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> sendLong(@HostParam("endpoint") String endpoint, @QueryParam("id") String id,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendLongRequest, RequestOptions requestOptions, Context context);

        @Post("/union/send-long")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> sendLongSync(@HostParam("endpoint") String endpoint, @QueryParam("id") String id,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendLongRequest, RequestOptions requestOptions, Context context);

        @Get("/union/param")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<Void>> get(@HostParam("endpoint") String endpoint, RequestOptions requestOptions,
            Context context);

        @Get("/union/param")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<Void> getSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions, Context context);

        @Post("/union/generate")
        @ExpectedResponses({ 202 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Mono<Response<BinaryData>> generate(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions, Context context);

        @Post("/union/generate")
        @ExpectedResponses({ 202 })
        @UnexpectedResponseExceptionType(value = ClientAuthenticationException.class, code = { 401 })
        @UnexpectedResponseExceptionType(value = ResourceNotFoundException.class, code = { 404 })
        @UnexpectedResponseExceptionType(value = ResourceModifiedException.class, code = { 409 })
        @UnexpectedResponseExceptionType(HttpResponseException.class)
        Response<BinaryData> generateSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions, Context context);
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     user (Optional): {
     *         user: String (Required)
     *     }
     *     input: BinaryData (Required)
     * }
     * }</pre>
     * 
     * @param id The id parameter.
     * @param sendRequest The sendRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> sendWithResponseAsync(String id, BinaryData sendRequest,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        return FluxUtil.withContext(context -> service.send(this.client.getEndpoint(), id,
            this.client.getServiceVersion().getVersion(), contentType, sendRequest, requestOptions, context));
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     user (Optional): {
     *         user: String (Required)
     *     }
     *     input: BinaryData (Required)
     * }
     * }</pre>
     * 
     * @param id The id parameter.
     * @param sendRequest The sendRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendWithResponse(String id, BinaryData sendRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendSync(this.client.getEndpoint(), id, this.client.getServiceVersion().getVersion(),
            contentType, sendRequest, requestOptions, Context.NONE);
    }

    /**
     * The sendLong operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>filter</td><td>String</td><td>No</td><td>The filter parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     user (Optional): {
     *         user: String (Required)
     *     }
     *     input: String (Required)
     *     dataInt: int (Required)
     *     dataUnion: BinaryData (Optional)
     *     dataLong: Long (Optional)
     *     data_float: Double (Optional)
     * }
     * }</pre>
     * 
     * @param id The id parameter.
     * @param sendLongRequest The sendLongRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> sendLongWithResponseAsync(String id, BinaryData sendLongRequest,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        return FluxUtil.withContext(context -> service.sendLong(this.client.getEndpoint(), id,
            this.client.getServiceVersion().getVersion(), contentType, sendLongRequest, requestOptions, context));
    }

    /**
     * The sendLong operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>filter</td><td>String</td><td>No</td><td>The filter parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     user (Optional): {
     *         user: String (Required)
     *     }
     *     input: String (Required)
     *     dataInt: int (Required)
     *     dataUnion: BinaryData (Optional)
     *     dataLong: Long (Optional)
     *     data_float: Double (Optional)
     * }
     * }</pre>
     * 
     * @param id The id parameter.
     * @param sendLongRequest The sendLongRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendLongWithResponse(String id, BinaryData sendLongRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendLongSync(this.client.getEndpoint(), id, this.client.getServiceVersion().getVersion(),
            contentType, sendLongRequest, requestOptions, Context.NONE);
    }

    /**
     * The get operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>data</td><td>BinaryData</td><td>No</td><td>The data parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> getWithResponseAsync(RequestOptions requestOptions) {
        return FluxUtil.withContext(context -> service.get(this.client.getEndpoint(), requestOptions, context));
    }

    /**
     * The get operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>data</td><td>BinaryData</td><td>No</td><td>The data parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> getWithResponse(RequestOptions requestOptions) {
        return service.getSync(this.client.getEndpoint(), requestOptions, Context.NONE);
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return provides status details for long running operations along with {@link Response} on successful completion
     * of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<BinaryData>> generateWithResponseAsync(RequestOptions requestOptions) {
        final String accept = "application/json";
        return FluxUtil.withContext(context -> service.generate(this.client.getEndpoint(),
            this.client.getServiceVersion().getVersion(), accept, requestOptions, context));
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return provides status details for long running operations along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Response<BinaryData> generateWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.generateSync(this.client.getEndpoint(), this.client.getServiceVersion().getVersion(), accept,
            requestOptions, Context.NONE);
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link PollerFlux} for polling of provides status details for long running operations.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    public PollerFlux<BinaryData, BinaryData> beginGenerateAsync(RequestOptions requestOptions) {
        return PollerFlux.create(Duration.ofSeconds(1), () -> this.generateWithResponseAsync(requestOptions),
            new com.cadl.union.implementation.OperationLocationPollingStrategy<>(
                new PollingStrategyOptions(this.client.getHttpPipeline())
                    .setEndpoint("{endpoint}/openai".replace("{endpoint}", this.client.getEndpoint()))
                    .setContext(requestOptions != null && requestOptions.getContext() != null
                        ? requestOptions.getContext()
                        : Context.NONE)
                    .setServiceVersion(this.client.getServiceVersion().getVersion()),
                "result"),
            TypeReference.createInstance(BinaryData.class), TypeReference.createInstance(BinaryData.class));
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link SyncPoller} for polling of provides status details for long running operations.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    public SyncPoller<BinaryData, BinaryData> beginGenerate(RequestOptions requestOptions) {
        return SyncPoller.createPoller(Duration.ofSeconds(1), () -> this.generateWithResponse(requestOptions),
            new com.cadl.union.implementation.SyncOperationLocationPollingStrategy<>(
                new PollingStrategyOptions(this.client.getHttpPipeline())
                    .setEndpoint("{endpoint}/openai".replace("{endpoint}", this.client.getEndpoint()))
                    .setContext(requestOptions != null && requestOptions.getContext() != null
                        ? requestOptions.getContext()
                        : Context.NONE)
                    .setServiceVersion(this.client.getServiceVersion().getVersion()),
                "result"),
            TypeReference.createInstance(BinaryData.class), TypeReference.createInstance(BinaryData.class));
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link PollerFlux} for polling of provides status details for long running operations.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    public PollerFlux<PollOperationDetails, Result> beginGenerateWithModelAsync(RequestOptions requestOptions) {
        return PollerFlux.create(Duration.ofSeconds(1), () -> this.generateWithResponseAsync(requestOptions),
            new com.cadl.union.implementation.OperationLocationPollingStrategy<>(
                new PollingStrategyOptions(this.client.getHttpPipeline())
                    .setEndpoint("{endpoint}/openai".replace("{endpoint}", this.client.getEndpoint()))
                    .setContext(requestOptions != null && requestOptions.getContext() != null
                        ? requestOptions.getContext()
                        : Context.NONE)
                    .setServiceVersion(this.client.getServiceVersion().getVersion()),
                "result"),
            TypeReference.createInstance(PollOperationDetails.class), TypeReference.createInstance(Result.class));
    }

    /**
     * A long-running remote procedure call (RPC) operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>{@code
     * {
     *     id: String (Required)
     *     status: String(NotStarted/Running/Succeeded/Failed/Canceled) (Required)
     *     error (Optional): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *     }
     *     result (Optional): {
     *         name: String (Required)
     *         result (Optional): (recursive schema, see result above)
     *         data: BinaryData (Required)
     *     }
     * }
     * }</pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link SyncPoller} for polling of provides status details for long running operations.
     */
    @ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)
    public SyncPoller<PollOperationDetails, Result> beginGenerateWithModel(RequestOptions requestOptions) {
        return SyncPoller.createPoller(Duration.ofSeconds(1), () -> this.generateWithResponse(requestOptions),
            new com.cadl.union.implementation.SyncOperationLocationPollingStrategy<>(
                new PollingStrategyOptions(this.client.getHttpPipeline())
                    .setEndpoint("{endpoint}/openai".replace("{endpoint}", this.client.getEndpoint()))
                    .setContext(requestOptions != null && requestOptions.getContext() != null
                        ? requestOptions.getContext()
                        : Context.NONE)
                    .setServiceVersion(this.client.getServiceVersion().getVersion()),
                "result"),
            TypeReference.createInstance(PollOperationDetails.class), TypeReference.createInstance(Result.class));
    }
}
