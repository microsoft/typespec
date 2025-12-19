package encode.bytes;

import encode.bytes.implementation.ResponseBodiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the synchronous BytesClient type.
 */
@ServiceClient(builder = BytesClientBuilder.class)
public final class ResponseBodyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ResponseBodiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ResponseBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ResponseBodyClient(ResponseBodiesImpl serviceClient, Instrumentation instrumentation) {
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
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> defaultMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.default", requestContext,
            updatedContext -> this.serviceClient.defaultMethodWithResponse(updatedContext));
    }

    /**
     * The defaultMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData defaultMethod() {
        return defaultMethodWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The octetStream operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> octetStreamWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.octetStream", requestContext,
            updatedContext -> this.serviceClient.octetStreamWithResponse(updatedContext));
    }

    /**
     * The octetStream operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData octetStream() {
        return octetStreamWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The customContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> customContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.customContentType",
            requestContext, updatedContext -> this.serviceClient.customContentTypeWithResponse(updatedContext));
    }

    /**
     * The customContentType operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData customContentType() {
        return customContentTypeWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The base64 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return represent a byte array along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<byte[]> base64WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.base64", requestContext,
            updatedContext -> this.serviceClient.base64WithResponse(updatedContext));
    }

    /**
     * The base64 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return represent a byte array.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public byte[] base64() {
        return base64WithResponse(RequestContext.none()).getValue();
    }

    /**
     * The base64url operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<byte[]> base64urlWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.base64url", requestContext,
            updatedContext -> this.serviceClient.base64urlWithResponse(updatedContext));
    }

    /**
     * The base64url operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public byte[] base64url() {
        return base64urlWithResponse(RequestContext.none()).getValue();
    }
}
