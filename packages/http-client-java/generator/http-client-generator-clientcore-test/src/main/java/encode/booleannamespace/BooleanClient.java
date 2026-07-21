package encode.booleannamespace;

import encode.booleannamespace.implementation.PropertiesImpl;
import encode.booleannamespace.property.BoolAsStringProperty;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the synchronous BooleanClient type.
 */
@ServiceClient(builder = BooleanClientBuilder.class)
public final class BooleanClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PropertiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BooleanClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    BooleanClient(PropertiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The trueLower operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> trueLowerWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.trueLower", requestContext,
            updatedContext -> this.serviceClient.trueLowerWithResponse(value, updatedContext));
    }

    /**
     * The trueLower operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BoolAsStringProperty trueLower(BoolAsStringProperty value) {
        return trueLowerWithResponse(value, RequestContext.none()).getValue();
    }

    /**
     * The falseLower operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> falseLowerWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.falseLower", requestContext,
            updatedContext -> this.serviceClient.falseLowerWithResponse(value, updatedContext));
    }

    /**
     * The falseLower operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BoolAsStringProperty falseLower(BoolAsStringProperty value) {
        return falseLowerWithResponse(value, RequestContext.none()).getValue();
    }

    /**
     * The trueUpper operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> trueUpperWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.trueUpper", requestContext,
            updatedContext -> this.serviceClient.trueUpperWithResponse(value, updatedContext));
    }

    /**
     * The trueUpper operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BoolAsStringProperty trueUpper(BoolAsStringProperty value) {
        return trueUpperWithResponse(value, RequestContext.none()).getValue();
    }

    /**
     * The falseMixed operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> falseMixedWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.falseMixed", requestContext,
            updatedContext -> this.serviceClient.falseMixedWithResponse(value, updatedContext));
    }

    /**
     * The falseMixed operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BoolAsStringProperty falseMixed(BoolAsStringProperty value) {
        return falseMixedWithResponse(value, RequestContext.none()).getValue();
    }
}
