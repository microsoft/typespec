package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import routes.implementation.PathParametersReservedExpansionsImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class PathParametersReservedExpansionClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PathParametersReservedExpansionsImpl serviceClient;

    /**
     * Initializes an instance of PathParametersReservedExpansionClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PathParametersReservedExpansionClient(PathParametersReservedExpansionsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> templateWithResponse(String param, RequestContext requestContext) {
        return this.serviceClient.templateWithResponse(param, requestContext);
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void template(String param) {
        templateWithResponse(param, RequestContext.none());
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> annotationWithResponse(String param, RequestContext requestContext) {
        return this.serviceClient.annotationWithResponse(param, requestContext);
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void annotation(String param) {
        annotationWithResponse(param, RequestContext.none());
    }
}
