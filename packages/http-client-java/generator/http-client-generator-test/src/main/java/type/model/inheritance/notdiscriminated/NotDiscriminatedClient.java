// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.model.inheritance.notdiscriminated;

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
import type.model.inheritance.notdiscriminated.implementation.NotDiscriminatedClientImpl;
import type.model.inheritance.notdiscriminated.models.Siamese;

/**
 * Initializes a new instance of the synchronous NotDiscriminatedClient type.
 */
@ServiceClient(builder = NotDiscriminatedClientBuilder.class)
public final class NotDiscriminatedClient {
    @Generated
    private final NotDiscriminatedClientImpl serviceClient;

    /**
     * Initializes an instance of NotDiscriminatedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    NotDiscriminatedClient(NotDiscriminatedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The postValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.postValidWithResponse(input, requestOptions);
    }

    /**
     * The getValid operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getValidWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getValidWithResponse(requestOptions);
    }

    /**
     * The putValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putValidWithResponse(input, requestOptions);
    }

    /**
     * The postValid operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postValid(Siamese input) {
        // Generated convenience method for postValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        postValidWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getValid operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Siamese getValid() {
        // Generated convenience method for getValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getValidWithResponse(requestOptions).getValue().toObject(Siamese.class);
    }

    /**
     * The putValid operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Siamese putValid(Siamese input) {
        // Generated convenience method for putValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return putValidWithResponse(BinaryData.fromObject(input), requestOptions).getValue().toObject(Siamese.class);
    }
}
