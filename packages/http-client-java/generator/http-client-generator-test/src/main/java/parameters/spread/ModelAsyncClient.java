// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package parameters.spread;

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
import parameters.spread.implementation.ModelsImpl;
import parameters.spread.implementation.models.SpreadCompositeRequestMixRequest;
import parameters.spread.model.models.BodyParameter;
import reactor.core.publisher.Mono;

/**
 * Initializes a new instance of the asynchronous SpreadClient type.
 */
@ServiceClient(builder = SpreadClientBuilder.class, isAsync = true)
public final class ModelAsyncClient {
    @Generated
    private final ModelsImpl serviceClient;

    /**
     * Initializes an instance of ModelAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    ModelAsyncClient(ModelsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The spreadAsRequestBody operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param bodyParameter The bodyParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> spreadAsRequestBodyWithResponse(BinaryData bodyParameter,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadAsRequestBodyWithResponseAsync(bodyParameter, requestOptions);
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
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
    public Mono<Response<Void>> spreadCompositeRequestOnlyWithBodyWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestOnlyWithBodyWithResponseAsync(body, requestOptions);
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> spreadCompositeRequestWithoutBodyWithResponse(String name, String testHeader,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestWithoutBodyWithResponseAsync(name, testHeader, requestOptions);
    }

    /**
     * The spreadCompositeRequest operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
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
    public Mono<Response<Void>> spreadCompositeRequestWithResponse(String name, String testHeader, BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestWithResponseAsync(name, testHeader, body, requestOptions);
    }

    /**
     * The spreadCompositeRequestMix operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param spreadCompositeRequestMixRequest The spreadCompositeRequestMixRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> spreadCompositeRequestMixWithResponse(String name, String testHeader,
        BinaryData spreadCompositeRequestMixRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestMixWithResponseAsync(name, testHeader,
            spreadCompositeRequestMixRequest, requestOptions);
    }

    /**
     * The spreadAsRequestBody operation.
     * 
     * @param name The name parameter.
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
    public Mono<Void> spreadAsRequestBody(String name) {
        // Generated convenience method for spreadAsRequestBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        BodyParameter bodyParameterObj = new BodyParameter(name);
        BinaryData bodyParameter = BinaryData.fromObject(bodyParameterObj);
        return spreadAsRequestBodyWithResponse(bodyParameter, requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
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
    public Mono<Void> spreadCompositeRequestOnlyWithBody(BodyParameter body) {
        // Generated convenience method for spreadCompositeRequestOnlyWithBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return spreadCompositeRequestOnlyWithBodyWithResponse(BinaryData.fromObject(body), requestOptions)
            .flatMap(FluxUtil::toMono);
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
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
    public Mono<Void> spreadCompositeRequestWithoutBody(String name, String testHeader) {
        // Generated convenience method for spreadCompositeRequestWithoutBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return spreadCompositeRequestWithoutBodyWithResponse(name, testHeader, requestOptions)
            .flatMap(FluxUtil::toMono);
    }

    /**
     * The spreadCompositeRequest operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
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
    public Mono<Void> spreadCompositeRequest(String name, String testHeader, BodyParameter body) {
        // Generated convenience method for spreadCompositeRequestWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return spreadCompositeRequestWithResponse(name, testHeader, BinaryData.fromObject(body), requestOptions)
            .flatMap(FluxUtil::toMono);
    }

    /**
     * The spreadCompositeRequestMix operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param prop The prop parameter.
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
    public Mono<Void> spreadCompositeRequestMix(String name, String testHeader, String prop) {
        // Generated convenience method for spreadCompositeRequestMixWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequestObj
            = new SpreadCompositeRequestMixRequest(prop);
        BinaryData spreadCompositeRequestMixRequest = BinaryData.fromObject(spreadCompositeRequestMixRequestObj);
        return spreadCompositeRequestMixWithResponse(name, testHeader, spreadCompositeRequestMixRequest, requestOptions)
            .flatMap(FluxUtil::toMono);
    }
}
