// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.pageable;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceClient;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.PagedFlux;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.PagedResponseBase;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import java.util.stream.Collectors;
import payload.pageable.implementation.ServerDrivenPaginationContinuationTokensImpl;
import payload.pageable.models.Pet;
import reactor.core.publisher.Flux;

/**
 * Initializes a new instance of the asynchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class, isAsync = true)
public final class ServerDrivenPaginationContinuationTokenAsyncClient {
    @Generated
    private final ServerDrivenPaginationContinuationTokensImpl serviceClient;

    /**
     * Initializes an instance of ServerDrivenPaginationContinuationTokenAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    ServerDrivenPaginationContinuationTokenAsyncClient(ServerDrivenPaginationContinuationTokensImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The requestQueryResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * <p><strong>Response Body Schema</strong></p>
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<BinaryData> requestQueryResponseBody(RequestOptions requestOptions) {
        return this.serviceClient.requestQueryResponseBodyAsync(requestOptions);
    }

    /**
     * The requestHeaderResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * <p><strong>Response Body Schema</strong></p>
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<BinaryData> requestHeaderResponseBody(RequestOptions requestOptions) {
        return this.serviceClient.requestHeaderResponseBodyAsync(requestOptions);
    }

    /**
     * The requestQueryResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * <p><strong>Response Body Schema</strong></p>
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<BinaryData> requestQueryResponseHeader(RequestOptions requestOptions) {
        return this.serviceClient.requestQueryResponseHeaderAsync(requestOptions);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * <p><strong>Response Body Schema</strong></p>
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<BinaryData> requestHeaderResponseHeader(RequestOptions requestOptions) {
        return this.serviceClient.requestHeaderResponseHeaderAsync(requestOptions);
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestQueryResponseBody(String token, String foo, String bar) {
        // Generated convenience method for requestQueryResponseBody
        RequestOptions requestOptions = new RequestOptions();
        if (token != null) {
            requestOptions.addQueryParam("token", token, false);
        }
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar, false);
        }
        PagedFlux<BinaryData> pagedFluxResponse = requestQueryResponseBody(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestQueryResponseBody() {
        // Generated convenience method for requestQueryResponseBody
        RequestOptions requestOptions = new RequestOptions();
        PagedFlux<BinaryData> pagedFluxResponse = requestQueryResponseBody(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestHeaderResponseBody(String token, String foo, String bar) {
        // Generated convenience method for requestHeaderResponseBody
        RequestOptions requestOptions = new RequestOptions();
        if (token != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("token"), token);
        }
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar, false);
        }
        PagedFlux<BinaryData> pagedFluxResponse = requestHeaderResponseBody(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestHeaderResponseBody() {
        // Generated convenience method for requestHeaderResponseBody
        RequestOptions requestOptions = new RequestOptions();
        PagedFlux<BinaryData> pagedFluxResponse = requestHeaderResponseBody(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestQueryResponseHeader(String token, String foo, String bar) {
        // Generated convenience method for requestQueryResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        if (token != null) {
            requestOptions.addQueryParam("token", token, false);
        }
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar, false);
        }
        PagedFlux<BinaryData> pagedFluxResponse = requestQueryResponseHeader(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestQueryResponseHeader() {
        // Generated convenience method for requestQueryResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        PagedFlux<BinaryData> pagedFluxResponse = requestQueryResponseHeader(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestHeaderResponseHeader(String token, String foo, String bar) {
        // Generated convenience method for requestHeaderResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        if (token != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("token"), token);
        }
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar, false);
        }
        PagedFlux<BinaryData> pagedFluxResponse = requestHeaderResponseHeader(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedFlux}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedFlux<Pet> requestHeaderResponseHeader() {
        // Generated convenience method for requestHeaderResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        PagedFlux<BinaryData> pagedFluxResponse = requestHeaderResponseHeader(requestOptions);
        return PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {
            Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)
                ? pagedFluxResponse.byPage().take(1)
                : pagedFluxResponse.byPage(continuationTokenParam).take(1);
            return flux.map(pagedResponse -> new PagedResponseBase<Void, Pet>(pagedResponse.getRequest(),
                pagedResponse.getStatusCode(), pagedResponse.getHeaders(),
                pagedResponse.getValue()
                    .stream()
                    .map(protocolMethodData -> protocolMethodData.toObject(Pet.class))
                    .collect(Collectors.toList()),
                pagedResponse.getContinuationToken(), null));
        });
    }
}
