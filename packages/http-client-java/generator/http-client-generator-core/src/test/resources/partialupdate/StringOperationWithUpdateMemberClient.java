// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) AutoRest Code Generator.

package com.azure.autorest.postprocessor.util;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceClient;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import fixtures.bodystring.implementation.StringOperationsImpl;
import fixtures.bodystring.implementation.EnumsImpl;

/** Initializes a new instance of the synchronous AutoRestSwaggerBatService type. */
@ServiceClient(builder = AutoRestSwaggerBatServiceBuilder.class)
public final class StringOperationWithUpdateMemberClient {

    @Generated private final StringOperationsImpl serviceClient;

    /**
     * Initializes an instance of StringOperations client.
     *
     * @param serviceClient the service client implementation.
     */
    @Generated
    StringOperationClient(StringOperationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * 2. manually update method signature
     *
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    Response<Void> putNullWithResponse(RequestOptions requestOptions, String test) {
        return this.serviceClient.putNullWithResponse(requestOptions);
    }


}
