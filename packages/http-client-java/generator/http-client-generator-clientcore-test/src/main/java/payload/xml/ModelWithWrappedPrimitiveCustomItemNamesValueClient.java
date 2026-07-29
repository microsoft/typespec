package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.xml.implementation.ModelWithWrappedPrimitiveCustomItemNamesValuesImpl;

/**
 * Initializes a new instance of the synchronous XmlClient type.
 */
@ServiceClient(builder = XmlClientBuilder.class)
public final class ModelWithWrappedPrimitiveCustomItemNamesValueClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ModelWithWrappedPrimitiveCustomItemNamesValuesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithWrappedPrimitiveCustomItemNamesValueClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ModelWithWrappedPrimitiveCustomItemNamesValueClient(
        ModelWithWrappedPrimitiveCustomItemNamesValuesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return §3.5 — Contains a wrapped primitive array with custom wrapper and item names along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithWrappedPrimitiveCustomItemNames> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Xml.ModelWithWrappedPrimitiveCustomItemNamesValue.get", requestContext,
            updatedContext -> this.serviceClient.getWithResponse(updatedContext));
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return §3.5 — Contains a wrapped primitive array with custom wrapper and item names.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelWithWrappedPrimitiveCustomItemNames get() {
        return getWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(ModelWithWrappedPrimitiveCustomItemNames input,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Xml.ModelWithWrappedPrimitiveCustomItemNamesValue.put", requestContext,
            updatedContext -> this.serviceClient.putWithResponse(input, updatedContext));
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(ModelWithWrappedPrimitiveCustomItemNames input) {
        putWithResponse(input, RequestContext.none());
    }
}
