// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.operationtemplates.implementation;

import azure.resourcemanager.operationtemplates.fluent.CheckNameAvailabilitiesClient;
import azure.resourcemanager.operationtemplates.fluent.models.CheckNameAvailabilityResponseInner;
import azure.resourcemanager.operationtemplates.models.CheckNameAvailabilityRequest;
import com.azure.core.annotation.BodyParam;
import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.HeaderParam;
import com.azure.core.annotation.Host;
import com.azure.core.annotation.HostParam;
import com.azure.core.annotation.PathParam;
import com.azure.core.annotation.Post;
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
import com.azure.core.util.logging.ClientLogger;
import reactor.core.publisher.Mono;

/**
 * An instance of this class provides access to all the operations defined in CheckNameAvailabilitiesClient.
 */
public final class CheckNameAvailabilitiesClientImpl implements CheckNameAvailabilitiesClient {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CheckNameAvailabilitiesService service;

    /**
     * The service client containing this operation class.
     */
    private final OperationTemplatesClientImpl client;

    /**
     * Initializes an instance of CheckNameAvailabilitiesClientImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    CheckNameAvailabilitiesClientImpl(OperationTemplatesClientImpl client) {
        this.service = RestProxy.create(CheckNameAvailabilitiesService.class, client.getHttpPipeline(),
            client.getSerializerAdapter());
        this.client = client;
    }

    /**
     * The interface defining all the services for OperationTemplatesClientCheckNameAvailabilities to be used by the
     * proxy service to perform REST calls.
     */
    @Host("{endpoint}")
    @ServiceInterface(name = "OperationTemplatesClientCheckNameAvailabilities")
    public interface CheckNameAvailabilitiesService {
        @Post("/subscriptions/{subscriptionId}/providers/Azure.ResourceManager.OperationTemplates/checkNameAvailability")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Mono<Response<CheckNameAvailabilityResponseInner>> checkGlobal(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CheckNameAvailabilityRequest body, Context context);

        @Post("/subscriptions/{subscriptionId}/providers/Azure.ResourceManager.OperationTemplates/checkNameAvailability")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Response<CheckNameAvailabilityResponseInner> checkGlobalSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CheckNameAvailabilityRequest body, Context context);

        @Post("/subscriptions/{subscriptionId}/providers/Azure.ResourceManager.OperationTemplates/locations/{location}/checkNameAvailability")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Mono<Response<CheckNameAvailabilityResponseInner>> checkLocal(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @PathParam("location") String location, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") CheckNameAvailabilityRequest body,
            Context context);

        @Post("/subscriptions/{subscriptionId}/providers/Azure.ResourceManager.OperationTemplates/locations/{location}/checkNameAvailability")
        @ExpectedResponses({ 200 })
        @UnexpectedResponseExceptionType(ManagementException.class)
        Response<CheckNameAvailabilityResponseInner> checkLocalSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, @PathParam("subscriptionId") String subscriptionId,
            @PathParam("location") String location, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") CheckNameAvailabilityRequest body,
            Context context);
    }

    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<CheckNameAvailabilityResponseInner>>
        checkGlobalWithResponseAsync(CheckNameAvailabilityRequest body) {
        if (this.client.getEndpoint() == null) {
            return Mono.error(
                new IllegalArgumentException("Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            return Mono.error(new IllegalArgumentException(
                "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (body == null) {
            return Mono.error(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        return FluxUtil
            .withContext(context -> service.checkGlobal(this.client.getEndpoint(), this.client.getApiVersion(),
                this.client.getSubscriptionId(), contentType, accept, body, context))
            .contextWrite(context -> context.putAll(FluxUtil.toReactorContext(this.client.getContext()).readOnly()));
    }

    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<CheckNameAvailabilityResponseInner> checkGlobalAsync(CheckNameAvailabilityRequest body) {
        return checkGlobalWithResponseAsync(body).flatMap(res -> Mono.justOrEmpty(res.getValue()));
    }

    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CheckNameAvailabilityResponseInner> checkGlobalWithResponse(CheckNameAvailabilityRequest body,
        Context context) {
        if (this.client.getEndpoint() == null) {
            throw LOGGER.atError()
                .log(new IllegalArgumentException(
                    "Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            throw LOGGER.atError()
                .log(new IllegalArgumentException(
                    "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (body == null) {
            throw LOGGER.atError().log(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.checkGlobalSync(this.client.getEndpoint(), this.client.getApiVersion(),
            this.client.getSubscriptionId(), contentType, accept, body, context);
    }

    /**
     * Implements global CheckNameAvailability operations.
     * 
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public CheckNameAvailabilityResponseInner checkGlobal(CheckNameAvailabilityRequest body) {
        return checkGlobalWithResponse(body, Context.NONE).getValue();
    }

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<Response<CheckNameAvailabilityResponseInner>> checkLocalWithResponseAsync(String location,
        CheckNameAvailabilityRequest body) {
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
        if (body == null) {
            return Mono.error(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        return FluxUtil
            .withContext(context -> service.checkLocal(this.client.getEndpoint(), this.client.getApiVersion(),
                this.client.getSubscriptionId(), location, contentType, accept, body, context))
            .contextWrite(context -> context.putAll(FluxUtil.toReactorContext(this.client.getContext()).readOnly()));
    }

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    private Mono<CheckNameAvailabilityResponseInner> checkLocalAsync(String location,
        CheckNameAvailabilityRequest body) {
        return checkLocalWithResponseAsync(location, body).flatMap(res -> Mono.justOrEmpty(res.getValue()));
    }

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @param context The context to associate with this operation.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CheckNameAvailabilityResponseInner> checkLocalWithResponse(String location,
        CheckNameAvailabilityRequest body, Context context) {
        if (this.client.getEndpoint() == null) {
            throw LOGGER.atError()
                .log(new IllegalArgumentException(
                    "Parameter this.client.getEndpoint() is required and cannot be null."));
        }
        if (this.client.getSubscriptionId() == null) {
            throw LOGGER.atError()
                .log(new IllegalArgumentException(
                    "Parameter this.client.getSubscriptionId() is required and cannot be null."));
        }
        if (location == null) {
            throw LOGGER.atError()
                .log(new IllegalArgumentException("Parameter location is required and cannot be null."));
        }
        if (body == null) {
            throw LOGGER.atError().log(new IllegalArgumentException("Parameter body is required and cannot be null."));
        } else {
            body.validate();
        }
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.checkLocalSync(this.client.getEndpoint(), this.client.getApiVersion(),
            this.client.getSubscriptionId(), location, contentType, accept, body, context);
    }

    /**
     * Implements local CheckNameAvailability operations.
     * 
     * @param location The name of the Azure region.
     * @param body The CheckAvailability request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws ManagementException thrown if the request is rejected by server.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the check availability result.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public CheckNameAvailabilityResponseInner checkLocal(String location, CheckNameAvailabilityRequest body) {
        return checkLocalWithResponse(location, body, Context.NONE).getValue();
    }

    private static final ClientLogger LOGGER = new ClientLogger(CheckNameAvailabilitiesClientImpl.class);
}
