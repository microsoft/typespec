// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.multicontenttypes;

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
import com.cadl.multicontenttypes.implementation.MultipleContentTypesOnRequestsImpl;

/**
 * Initializes a new instance of the synchronous MultiContentTypesClient type.
 */
@ServiceClient(builder = MultiContentTypesClientBuilder.class)
public final class MultipleContentTypesOnRequestClient {
    @Generated
    private final MultipleContentTypesOnRequestsImpl serviceClient;

    /**
     * Initializes an instance of MultipleContentTypesOnRequestClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    MultipleContentTypesOnRequestClient(MultipleContentTypesOnRequestsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * one data type maps to multiple content types.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param contentType The contentType parameter. Allowed values: "application/octet-stream", "image/jpeg",
     * "image/png", "application/json-patch+json".
     * @param data The data parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadBytesWithSingleBodyTypeForMultiContentTypesWithResponse(String contentType,
        BinaryData data, RequestOptions requestOptions) {
        return this.serviceClient.uploadBytesWithSingleBodyTypeForMultiContentTypesWithResponse(contentType, data,
            requestOptions);
    }

    /**
     * multiple data types map to multiple content types using shared route.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param contentType The contentType parameter. Allowed values: "application/octet-stream", "image/jpeg",
     * "image/png".
     * @param data The data parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadBytesWithMultiBodyTypesForMultiContentTypesWithResponse(String contentType,
        BinaryData data, RequestOptions requestOptions) {
        return this.serviceClient.uploadBytesWithMultiBodyTypesForMultiContentTypesWithResponse(contentType, data,
            requestOptions);
    }

    /**
     * multiple data types map to multiple content types using shared route.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param data The data parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadJsonWithMultiBodyTypesForMultiContentTypesWithResponse(BinaryData data,
        RequestOptions requestOptions) {
        return this.serviceClient.uploadJsonWithMultiBodyTypesForMultiContentTypesWithResponse(data, requestOptions);
    }

    /**
     * multiple data types map to multiple content types using shared route.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param contentType The contentType parameter. Allowed values: "application/json", "application/octet-stream",
     * "image/jpeg", "image/png".
     * @param data The data parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadJsonOrBytesWithMultiBodyTypesForMultiContentTypesWithResponse(String contentType,
        BinaryData data, RequestOptions requestOptions) {
        return this.serviceClient.uploadJsonOrBytesWithMultiBodyTypesForMultiContentTypesWithResponse(contentType, data,
            requestOptions);
    }
}
