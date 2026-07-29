package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.pageable.implementation.XmlPaginationsImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class XmlPaginationClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final XmlPaginationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of XmlPaginationClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    XmlPaginationClient(XmlPaginationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The listWithContinuation operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets as paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithContinuation() {
        return listWithContinuation(RequestContext.none());
    }

    /**
     * The listWithContinuation operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets as paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithContinuation(RequestContext requestContext) {
        return this.serviceClient.listWithContinuation(requestContext);
    }

    /**
     * The listWithNextLink operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link as paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithNextLink() {
        return listWithNextLink(RequestContext.none());
    }

    /**
     * The listWithNextLink operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link as paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithNextLink(RequestContext requestContext) {
        return this.serviceClient.listWithNextLink(requestContext);
    }
}
