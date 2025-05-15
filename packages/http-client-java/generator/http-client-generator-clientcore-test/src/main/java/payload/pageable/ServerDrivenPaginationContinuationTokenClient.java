package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.paging.PagedIterable;
import payload.pageable.implementation.ServerDrivenPaginationContinuationTokensImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class ServerDrivenPaginationContinuationTokenClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ServerDrivenPaginationContinuationTokensImpl serviceClient;

    /**
     * Initializes an instance of ServerDrivenPaginationContinuationTokenClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ServerDrivenPaginationContinuationTokenClient(ServerDrivenPaginationContinuationTokensImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar) {
        return this.serviceClient.requestQueryResponseBody(foo, bar);
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody() {
        return this.serviceClient.requestQueryResponseBody();
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestQueryResponseBody(foo, bar, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar) {
        return this.serviceClient.requestHeaderResponseBody(foo, bar);
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody() {
        return this.serviceClient.requestHeaderResponseBody();
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestHeaderResponseBody(foo, bar, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar) {
        return this.serviceClient.requestQueryResponseHeader(foo, bar);
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader() {
        return this.serviceClient.requestQueryResponseHeader();
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestQueryResponseHeader(foo, bar, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar) {
        return this.serviceClient.requestHeaderResponseHeader(foo, bar);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader() {
        return this.serviceClient.requestHeaderResponseHeader();
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestHeaderResponseHeader(foo, bar, requestContext);
    }
}
