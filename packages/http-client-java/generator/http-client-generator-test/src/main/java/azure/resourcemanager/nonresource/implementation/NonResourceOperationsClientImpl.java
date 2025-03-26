// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.nonresource.implementation;

import azure.resourcemanager.nonresource.fluent.NonResourceOperationsClient;
import azure.resourcemanager.nonresource.fluent.models.NonResourceInner;
import com.azure.core.annotation.BodyParam;
import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.Get;
import com.azure.core.annotation.HeaderParam;
import com.azure.core.annotation.Headers;
import com.azure.core.annotation.Host;
import com.azure.core.annotation.HostParam;
import com.azure.core.annotation.PathParam;
import com.azure.core.annotation.Put;
import com.azure.core.annotation.QueryParam;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceInterface;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.annotation.UnexpectedResponseExceptionType;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.management.exception.ManagementException;
import com.azure.core.util.Context;
import com.azure.core.util.FluxUtil;
import reactor.core.publisher.Mono;

/**
 * An instance of this class provides access to all the operations defined in NonResourceOperationsClient.
 */
public final class NonResourceOperationsClientImpl implements NonResourceOperationsClient {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NonResourceOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final NonResourceClientImpl client;

    /**
     * Initializes an instance of NonResourceOperationsClientImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NonResourceOperationsClientImpl(NonResourceClientImpl client) {
        this.service = RestProxy.create(NonResourceOperationsService.class, client.getHttpPipeline(),
            client.getSerializerAdapter());
        this.client = client;
    }

    /**
     * The interface defining all the services for NonResourceClientNonResourceOperations to be used by the proxy
     * service to perform REST calls.
     */
    @Host("{endpoint}")
    @ServiceInterface(name = "NonResourceClientNon")
    public interface NonResourceOperationsService {
        @Headers({ "Content-Type: application/json" })
        @Get("/subscriptions/{subscriptionId}/providers/Microsoft.NonResource/locations/{location}/otherParameters/{parameter}")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Mono<Response<NonResourceInner>> get(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @PathParam("location") String location, @PathParam("parameter") String parameter,
            @HeaderParam("Accept") String accept, Context context);

        @Put("/subscriptions/{subscriptionId}/providers/Microsoft.NonResource/locations/{location}/otherParameters/{parameter}")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Mono<Response<NonResourceInner>> create(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @PathParam("location") String location, @PathParam("parameter") String parameter,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") NonResourceInner body, Context context);
    }

    /**
     * The get operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<NonResourceInner>> getWithResponseAsync(String location, String parameter) {
        if (this.client.getEndpoint() == null) {
            return Mono.error(
                new IllegalArgumentException("Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            return Mono.error(new IllegalArgumentException(
                "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (location == null) {
            return Mono.error(new IllegalArgumentException("Parameter location is required and cannot be null."));
        }
        if (parameter == null) {
            return Mono.error(new IllegalArgumentException("Parameter parameter is required and cannot be null."));
        }
        final String accept = "application/json";
        return FluxUtil
            .withContext(context -> service.get(this.client.getEndpoint(), this.client.getApiVersion(),
                this.client.getSubscriptionId(), location, parameter, accept, context))
            .contextWrite(context -> context.putAll(FluxUtil.toReactorContext(this.client.getContext()).readOnly()));
    }

    /**
     * The get operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<NonResourceInner>> getWithResponseAsync(String location, String parameter, Context context) {
        if (this.client.getEndpoint() == null) {
            return Mono.error(
                new IllegalArgumentException("Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            return Mono.error(new IllegalArgumentException(
                "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (location == null) {
            return Mono.error(new IllegalArgumentException("Parameter location is required and cannot be null."));
        }
        if (parameter == null) {
            return Mono.error(new IllegalArgumentException("Parameter parameter is required and cannot be null."));
        }
        final String accept = "application/json";
        context = this.client.mergeContext(context);
        return service.get(this.client.getEndpoint(), this.client.getApiVersion(), this.client.getSubscriptionId(),
            location, parameter, accept, context);
    }

    /**
     * The get operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<NonResourceInner> getAsync(String location, String parameter) {
        return getWithResponseAsync(location, parameter).flatMap(res -> Mono.justOrEmpty(res.getValue()));
    }

    /**
     * The get operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NonResourceInner> getWithResponse(String location, String parameter, Context context) {
        return getWithResponseAsync(location, parameter, context).block();
    }

    /**
     * The get operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource`.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public NonResourceInner get(String location, String parameter) {
        return getWithResponse(location, parameter, Context.NONE).getValue();
    }

    /**
     * The create operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param body The request body.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<NonResourceInner>> createWithResponseAsync(String location, String parameter,
        NonResourceInner body) {
        if (this.client.getEndpoint() == null) {
            return Mono.error(
                new IllegalArgumentException("Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            return Mono.error(new IllegalArgumentException(
                "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (location == null) {
            return Mono.error(new IllegalArgumentException("Parameter location is required and cannot be null."));
        }
        if (parameter == null) {
            return Mono.error(new IllegalArgumentException("Parameter parameter is required and cannot be null."));
        }
        if (body == null) {
            return Mono.error(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        return FluxUtil
            .withContext(context -> service.create(this.client.getEndpoint(), this.client.getApiVersion(),
                this.client.getSubscriptionId(), location, parameter, contentType, accept, body, context))
            .contextWrite(context -> context.putAll(FluxUtil.toReactorContext(this.client.getContext()).readOnly()));
    }

    /**
     * The create operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param body The request body.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<NonResourceInner>> createWithResponseAsync(String location, String parameter,
        NonResourceInner body, Context context) {
        if (this.client.getEndpoint() == null) {
            return Mono.error(
                new IllegalArgumentException("Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            return Mono.error(new IllegalArgumentException(
                "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (location == null) {
            return Mono.error(new IllegalArgumentException("Parameter location is required and cannot be null."));
        }
        if (parameter == null) {
            return Mono.error(new IllegalArgumentException("Parameter parameter is required and cannot be null."));
        }
        if (body == null) {
            return Mono.error(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        context = this.client.mergeContext(context);
        return service.create(this.client.getEndpoint(), this.client.getApiVersion(), this.client.getSubscriptionId(),
            location, parameter, contentType, accept, body, context);
    }

    /**
     * The create operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param body The request body.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<NonResourceInner> createAsync(String location, String parameter, NonResourceInner body) {
        return createWithResponseAsync(location, parameter, body).flatMap(res -> Mono.justOrEmpty(res.getValue()));
    }

    /**
     * The create operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param body The request body.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource` along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NonResourceInner> createWithResponse(String location, String parameter, NonResourceInner body,
        Context context) {
        return createWithResponseAsync(location, parameter, body, context).block();
    }

    /**
     * The create operation.
     * 
     * @param location The location parameter.
     * @param parameter Another parameter.
     * @param body The request body.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends
     * `Resource`.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public NonResourceInner create(String location, String parameter, NonResourceInner body) {
        return createWithResponse(location, parameter, body, Context.NONE).getValue();
    }
}
