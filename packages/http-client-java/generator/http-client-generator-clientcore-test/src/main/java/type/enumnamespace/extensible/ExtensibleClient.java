package type.enumnamespace.extensible;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.enumnamespace.extensible.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous ExtensibleClient type.
 */
@ServiceClient(builder = ExtensibleClientBuilder.class)
public final class ExtensibleClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtensibleClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ExtensibleClient(StringOperationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getKnownValue operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekExtensibleEnum> getKnownValueWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.getKnownValue", requestContext,
            updatedContext -> this.serviceClient.getKnownValueWithResponse(updatedContext));
    }

    /**
     * The getKnownValue operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public DaysOfWeekExtensibleEnum getKnownValue() {
        return getKnownValueWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getUnknownValue operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekExtensibleEnum> getUnknownValueWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.getUnknownValue",
            requestContext, updatedContext -> this.serviceClient.getUnknownValueWithResponse(updatedContext));
    }

    /**
     * The getUnknownValue operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public DaysOfWeekExtensibleEnum getUnknownValue() {
        return getUnknownValueWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putKnownValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putKnownValueWithResponse(DaysOfWeekExtensibleEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.putKnownValue", requestContext,
            updatedContext -> this.serviceClient.putKnownValueWithResponse(body, updatedContext));
    }

    /**
     * The putKnownValue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putKnownValue(DaysOfWeekExtensibleEnum body) {
        putKnownValueWithResponse(body, RequestContext.none());
    }

    /**
     * The putUnknownValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putUnknownValueWithResponse(DaysOfWeekExtensibleEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.putUnknownValue",
            requestContext, updatedContext -> this.serviceClient.putUnknownValueWithResponse(body, updatedContext));
    }

    /**
     * The putUnknownValue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putUnknownValue(DaysOfWeekExtensibleEnum body) {
        putUnknownValueWithResponse(body, RequestContext.none());
    }
}
