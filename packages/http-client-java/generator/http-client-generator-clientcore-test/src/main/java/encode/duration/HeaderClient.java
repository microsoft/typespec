package encode.duration;

import encode.duration.implementation.HeadersImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import java.time.Duration;
import java.util.List;

/**
 * Initializes a new instance of the synchronous DurationClient type.
 */
@ServiceClient(builder = DurationClientBuilder.class)
public final class HeaderClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final HeadersImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of HeaderClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    HeaderClient(HeadersImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.default", requestContext,
            updatedContext -> this.serviceClient.defaultMethodWithResponse(duration, updatedContext));
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void defaultMethod(Duration duration) {
        defaultMethodWithResponse(duration, RequestContext.none());
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> iso8601WithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.iso8601", requestContext,
            updatedContext -> this.serviceClient.iso8601WithResponse(duration, updatedContext));
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void iso8601(Duration duration) {
        iso8601WithResponse(duration, RequestContext.none());
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> iso8601ArrayWithResponse(List<Duration> duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.iso8601Array", requestContext,
            updatedContext -> this.serviceClient.iso8601ArrayWithResponse(duration, updatedContext));
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void iso8601Array(List<Duration> duration) {
        iso8601ArrayWithResponse(duration, RequestContext.none());
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32SecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.int32Seconds", requestContext,
            updatedContext -> this.serviceClient.int32SecondsWithResponse(duration, updatedContext));
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void int32Seconds(Duration duration) {
        int32SecondsWithResponse(duration, RequestContext.none());
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatSecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.floatSeconds", requestContext,
            updatedContext -> this.serviceClient.floatSecondsWithResponse(duration, updatedContext));
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void floatSeconds(Duration duration) {
        floatSecondsWithResponse(duration, RequestContext.none());
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> float64SecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.float64Seconds", requestContext,
            updatedContext -> this.serviceClient.float64SecondsWithResponse(duration, updatedContext));
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void float64Seconds(Duration duration) {
        float64SecondsWithResponse(duration, RequestContext.none());
    }
}
