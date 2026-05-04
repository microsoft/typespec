package encode.datetime;

import encode.datetime.implementation.ResponseHeadersImpl;
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
 * Initializes a new instance of the synchronous DatetimeClient type.
 */
@ServiceClient(builder = DatetimeClientBuilder.class)
public final class ResponseHeaderClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ResponseHeadersImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ResponseHeaderClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ResponseHeaderClient(ResponseHeadersImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.ResponseHeader.default", requestContext,
            updatedContext -> this.serviceClient.defaultMethodWithResponse(updatedContext));
    }

    /**
     * The defaultMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void defaultMethod() {
        defaultMethodWithResponse(RequestContext.none());
    }

    /**
     * The rfc3339 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc3339WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.ResponseHeader.rfc3339", requestContext,
            updatedContext -> this.serviceClient.rfc3339WithResponse(updatedContext));
    }

    /**
     * The rfc3339 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void rfc3339() {
        rfc3339WithResponse(RequestContext.none());
    }

    /**
     * The rfc7231 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc7231WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.ResponseHeader.rfc7231", requestContext,
            updatedContext -> this.serviceClient.rfc7231WithResponse(updatedContext));
    }

    /**
     * The rfc7231 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void rfc7231() {
        rfc7231WithResponse(RequestContext.none());
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> unixTimestampWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.ResponseHeader.unixTimestamp",
            requestContext, updatedContext -> this.serviceClient.unixTimestampWithResponse(updatedContext));
    }

    /**
     * The unixTimestamp operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void unixTimestamp() {
        unixTimestampWithResponse(RequestContext.none());
    }
}
