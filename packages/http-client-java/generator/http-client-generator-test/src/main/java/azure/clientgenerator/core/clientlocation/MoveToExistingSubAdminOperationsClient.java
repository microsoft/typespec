// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.implementation.MoveToExistingSubAdminOperationsImpl;
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

/**
 * Initializes a new instance of the synchronous ClientLocationClient type.
 */
@ServiceClient(builder = ClientLocationClientBuilder.class)
public final class MoveToExistingSubAdminOperationsClient {
    @Generated
    private final MoveToExistingSubAdminOperationsImpl serviceClient;

    /**
     * Initializes an instance of MoveToExistingSubAdminOperationsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    MoveToExistingSubAdminOperationsClient(MoveToExistingSubAdminOperationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The getAdminInfo operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> getAdminInfoWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAdminInfoWithResponse(requestOptions);
    }

    /**
     * The deleteUser operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteUserWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.deleteUserWithResponse(requestOptions);
    }

    /**
     * The getAdminInfo operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void getAdminInfo() {
        // Generated convenience method for getAdminInfoWithResponse
        RequestOptions requestOptions = new RequestOptions();
        getAdminInfoWithResponse(requestOptions).getValue();
    }

    /**
     * The deleteUser operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void deleteUser() {
        // Generated convenience method for deleteUserWithResponse
        RequestOptions requestOptions = new RequestOptions();
        deleteUserWithResponse(requestOptions).getValue();
    }
}
