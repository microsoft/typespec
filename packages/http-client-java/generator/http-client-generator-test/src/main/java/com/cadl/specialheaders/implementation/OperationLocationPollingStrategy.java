// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.specialheaders.implementation;

import com.azure.core.exception.AzureException;
import com.azure.core.http.HttpHeader;
import com.azure.core.http.rest.Response;
import com.azure.core.util.BinaryData;
import com.azure.core.util.logging.ClientLogger;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.OperationResourcePollingStrategy;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.PollingContext;
import com.azure.core.util.polling.PollingStrategyOptions;
import com.azure.core.util.serializer.JsonSerializerProviders;
import com.azure.core.util.serializer.ObjectSerializer;
import com.azure.core.util.serializer.TypeReference;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.OffsetDateTime;

// DO NOT modify this helper class

/**
 * Implements an operation location polling strategy, from Operation-Location.
 *
 * @param <T> the type of the response type from a polling call, or BinaryData if raw response body should be kept
 * @param <U> the type of the final result object to deserialize into, or BinaryData if raw response body should be
 * kept
 */
public final class OperationLocationPollingStrategy<T, U> extends OperationResourcePollingStrategy<T, U> {

    private static final ClientLogger LOGGER = new ClientLogger(OperationLocationPollingStrategy.class);

    private final ObjectSerializer serializer;
    private final String endpoint;
    private final String propertyName;

    /**
     * Creates an instance of the operation resource polling strategy.
     *
     * @param pollingStrategyOptions options to configure this polling strategy.
     * @throws NullPointerException if {@code pollingStrategyOptions} is null.
     */
    public OperationLocationPollingStrategy(PollingStrategyOptions pollingStrategyOptions) {
        this(pollingStrategyOptions, null);
    }

    /**
     * Creates an instance of the operation resource polling strategy.
     *
     * @param pollingStrategyOptions options to configure this polling strategy.
     * @param propertyName the name of the property to extract final result.
     * @throws NullPointerException if {@code pollingStrategyOptions} is null.
     */
    public OperationLocationPollingStrategy(PollingStrategyOptions pollingStrategyOptions, String propertyName) {
        super(PollingUtils.OPERATION_LOCATION_HEADER, pollingStrategyOptions);
        this.propertyName = propertyName;
        this.endpoint = pollingStrategyOptions.getEndpoint();
        this.serializer = pollingStrategyOptions.getSerializer() != null
            ? pollingStrategyOptions.getSerializer()
            : JsonSerializerProviders.createInstance(true);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Mono<PollResponse<T>> onInitialResponse(Response<?> response, PollingContext<T> pollingContext,
        TypeReference<T> pollResponseType) {
        // Response<?> is Response<BinaryData>

        HttpHeader operationLocationHeader = response.getHeaders().get(PollingUtils.OPERATION_LOCATION_HEADER);
        if (operationLocationHeader != null) {
            pollingContext.setData(PollingUtils.OPERATION_LOCATION_HEADER.getCaseSensitiveName(),
                PollingUtils.getAbsolutePath(operationLocationHeader.getValue(), endpoint, LOGGER));
        }
        final String httpMethod = response.getRequest().getHttpMethod().name();
        pollingContext.setData(PollingUtils.HTTP_METHOD, httpMethod);
        pollingContext.setData(PollingUtils.REQUEST_URL, response.getRequest().getUrl().toString());

        if (response.getStatusCode() == 200
            || response.getStatusCode() == 201
            || response.getStatusCode() == 202
            || response.getStatusCode() == 204) {
            final Duration retryAfter
                = PollingUtils.getRetryAfterFromHeaders(response.getHeaders(), OffsetDateTime::now);
            final Mono<PollResponse<T>> pollResponseMono
                = PollingUtils.deserializeResponse((BinaryData) response.getValue(), serializer, pollResponseType)
                    .onErrorResume(exception -> {
                        LOGGER.info("Failed to parse initial response.");
                        return Mono.empty();
                    })
                    .map(value -> new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, value, retryAfter));
            return pollResponseMono.switchIfEmpty(
                Mono.fromSupplier(() -> new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, null, retryAfter)));
        } else {
            return Mono
                .error(
                    new AzureException(String.format(
                        "Operation failed or cancelled with status code %d,"
                            + ", '%s' header: %s, and response body: %s",
                        response.getStatusCode(), PollingUtils.OPERATION_LOCATION_HEADER, operationLocationHeader,
                        response.getValue())));
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Mono<U> getResult(PollingContext<T> pollingContext, TypeReference<U> resultType) {
        if (pollingContext.getLatestResponse().getStatus() == LongRunningOperationStatus.FAILED) {
            return Mono.error(new AzureException("Long running operation failed."));
        } else if (pollingContext.getLatestResponse().getStatus() == LongRunningOperationStatus.USER_CANCELLED) {
            return Mono.error(new AzureException("Long running operation cancelled."));
        }
        if (propertyName != null) {
            // take the last poll response body from PollingContext,
            // and de-serialize the <propertyName> property as final result
            BinaryData latestResponseBody
                = BinaryData.fromString(pollingContext.getData(PollingUtils.POLL_RESPONSE_BODY));
            return PollingUtils
                .deserializeResponse(latestResponseBody, serializer, PollingUtils.POST_POLL_RESULT_TYPE_REFERENCE)
                .flatMap(value -> {
                    if (value.get(propertyName) != null) {
                        return BinaryData.fromObjectAsync(value.get(propertyName))
                            .flatMap(result -> PollingUtils.deserializeResponse(result, serializer, resultType));
                    } else {
                        return Mono.error(new AzureException("Cannot get final result"));
                    }
                })
                .switchIfEmpty(Mono.error(new AzureException("Cannot get final result")));
        } else {
            return super.getResult(pollingContext, resultType);
        }
    }
}
