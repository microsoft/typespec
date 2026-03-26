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
import payload.xml.implementation.ModelWithRenamedUnwrappedModelArrayValuesImpl;

/**
 * Initializes a new instance of the synchronous XmlClient type.
 */
@ServiceClient(builder = XmlClientBuilder.class)
public final class ModelWithRenamedUnwrappedModelArrayValueClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ModelWithRenamedUnwrappedModelArrayValuesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithRenamedUnwrappedModelArrayValueClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ModelWithRenamedUnwrappedModelArrayValueClient(ModelWithRenamedUnwrappedModelArrayValuesImpl serviceClient,
        Instrumentation instrumentation) {
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
     * @return §4.4 — Contains an unwrapped array of models with a custom item name along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithRenamedUnwrappedModelArray> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedUnwrappedModelArrayValue.get",
            requestContext, updatedContext -> this.serviceClient.getWithResponse(updatedContext));
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return §4.4 — Contains an unwrapped array of models with a custom item name.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelWithRenamedUnwrappedModelArray get() {
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
    public Response<Void> putWithResponse(ModelWithRenamedUnwrappedModelArray input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedUnwrappedModelArrayValue.put",
            requestContext, updatedContext -> this.serviceClient.putWithResponse(input, updatedContext));
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
    public void put(ModelWithRenamedUnwrappedModelArray input) {
        putWithResponse(input, RequestContext.none());
    }
}
