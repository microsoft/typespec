package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import routes.implementation.InInterfacesImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class InInterfaceClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final InInterfacesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of InInterfaceClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    InInterfaceClient(InInterfacesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The fixed operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fixedWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.InInterface.fixed", requestContext,
            updatedContext -> this.serviceClient.fixedWithResponse(updatedContext));
    }

    /**
     * The fixed operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void fixed() {
        fixedWithResponse(RequestContext.none());
    }
}
