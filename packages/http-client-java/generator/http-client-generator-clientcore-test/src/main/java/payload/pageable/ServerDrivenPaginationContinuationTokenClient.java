package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.RequestOptions;
import payload.pageable.implementation.ServerDrivenPaginationContinuationTokensImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class ServerDrivenPaginationContinuationTokenClient {
    @Metadata(generated = true)
    private final ServerDrivenPaginationContinuationTokensImpl serviceClient;

    /**
     * Initializes an instance of ServerDrivenPaginationContinuationTokenClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ServerDrivenPaginationContinuationTokenClient(ServerDrivenPaginationContinuationTokensImpl serviceClient) {
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
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(RequestOptions requestOptions) {
        return this.serviceClient.requestQueryResponseBody(requestOptions);
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
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(RequestOptions requestOptions) {
        return this.serviceClient.requestHeaderResponseBody(requestOptions);
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
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(RequestOptions requestOptions) {
        return this.serviceClient.requestQueryResponseHeader(requestOptions);
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
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(RequestOptions requestOptions) {
        return this.serviceClient.requestHeaderResponseHeader(requestOptions);
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar) {
        // Generated convenience method for requestQueryResponseBody
        RequestOptions requestOptions = new RequestOptions();
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar);
        }
        return serviceClient.requestQueryResponseBody(requestOptions);
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody() {
        // Generated convenience method for requestQueryResponseBody
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.requestQueryResponseBody(requestOptions);
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar) {
        // Generated convenience method for requestHeaderResponseBody
        RequestOptions requestOptions = new RequestOptions();
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar);
        }
        return serviceClient.requestHeaderResponseBody(requestOptions);
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody() {
        // Generated convenience method for requestHeaderResponseBody
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.requestHeaderResponseBody(requestOptions);
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar) {
        // Generated convenience method for requestQueryResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar);
        }
        return serviceClient.requestQueryResponseHeader(requestOptions);
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader() {
        // Generated convenience method for requestQueryResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.requestQueryResponseHeader(requestOptions);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar) {
        // Generated convenience method for requestHeaderResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        if (foo != null) {
            requestOptions.setHeader(HttpHeaderName.fromString("foo"), foo);
        }
        if (bar != null) {
            requestOptions.addQueryParam("bar", bar);
        }
        return serviceClient.requestHeaderResponseHeader(requestOptions);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader() {
        // Generated convenience method for requestHeaderResponseHeader
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.requestHeaderResponseHeader(requestOptions);
    }
}
