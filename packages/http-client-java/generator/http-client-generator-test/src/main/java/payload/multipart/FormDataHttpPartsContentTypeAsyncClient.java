// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.multipart;

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
import com.azure.core.util.FluxUtil;
import payload.multipart.implementation.FormDataHttpPartsContentTypesImpl;
import payload.multipart.implementation.MultipartFormDataHelper;
import payload.multipart.models.FileWithHttpPartOptionalContentTypeRequest;
import payload.multipart.models.FileWithHttpPartRequiredContentTypeRequest;
import payload.multipart.models.FileWithHttpPartSpecificContentTypeRequest;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the asynchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class, isAsync = true)
public final class FormDataHttpPartsContentTypeAsyncClient {
    @Generated
    private final FormDataHttpPartsContentTypesImpl serviceClient;

    /**
     * Initializes an instance of FormDataHttpPartsContentTypeAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    FormDataHttpPartsContentTypeAsyncClient(FormDataHttpPartsContentTypesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    Mono<Response<Void>> imageJpegContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        // Operation 'imageJpegContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.serviceClient.imageJpegContentTypeWithResponseAsync(body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    Mono<Response<Void>> requiredContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        // Operation 'requiredContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.serviceClient.requiredContentTypeWithResponseAsync(body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    Mono<Response<Void>> optionalContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        // Operation 'optionalContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.serviceClient.optionalContentTypeWithResponseAsync(body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> imageJpegContentType(FileWithHttpPartSpecificContentTypeRequest body) {
        // Generated convenience method for imageJpegContentTypeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return imageJpegContentTypeWithResponse(
            new MultipartFormDataHelper(requestOptions)
                .serializeFileField("profileImage", body.getProfileImage().getContent(),
                    body.getProfileImage().getContentType(), body.getProfileImage().getFilename())
                .end()
                .getRequestBody(),
            requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> requiredContentType(FileWithHttpPartRequiredContentTypeRequest body) {
        // Generated convenience method for requiredContentTypeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return requiredContentTypeWithResponse(
            new MultipartFormDataHelper(requestOptions)
                .serializeFileField("profileImage", body.getProfileImage().getContent(),
                    body.getProfileImage().getContentType(), body.getProfileImage().getFilename())
                .end()
                .getRequestBody(),
            requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> optionalContentType(FileWithHttpPartOptionalContentTypeRequest body) {
        // Generated convenience method for optionalContentTypeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return optionalContentTypeWithResponse(
            new MultipartFormDataHelper(requestOptions)
                .serializeFileField("profileImage", body.getProfileImage().getContent(),
                    body.getProfileImage().getContentType(), body.getProfileImage().getFilename())
                .end()
                .getRequestBody(),
            requestOptions).flatMap(FluxUtil::toMono);
    }
}
