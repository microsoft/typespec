package parameters.collectionformat;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import java.util.List;
import parameters.collectionformat.implementation.QueriesImpl;

/**
 * Initializes a new instance of the synchronous CollectionFormatClient type.
 */
@ServiceClient(builder = CollectionFormatClientBuilder.class)
public final class QueryClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final QueriesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueryClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    QueryClient(QueriesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> multiWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.multi", requestContext,
            updatedContext -> this.serviceClient.multiWithResponse(colors, updatedContext));
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void multi(List<String> colors) {
        multiWithResponse(colors, RequestContext.none());
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> ssvWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.ssv", requestContext,
            updatedContext -> this.serviceClient.ssvWithResponse(colors, updatedContext));
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void ssv(List<String> colors) {
        ssvWithResponse(colors, RequestContext.none());
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> pipesWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.pipes", requestContext,
            updatedContext -> this.serviceClient.pipesWithResponse(colors, updatedContext));
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void pipes(List<String> colors) {
        pipesWithResponse(colors, RequestContext.none());
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> csvWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.csv", requestContext,
            updatedContext -> this.serviceClient.csvWithResponse(colors, updatedContext));
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void csv(List<String> colors) {
        csvWithResponse(colors, RequestContext.none());
    }
}
