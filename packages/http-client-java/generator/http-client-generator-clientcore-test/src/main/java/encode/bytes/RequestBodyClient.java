package encode.bytes;

import encode.bytes.implementation.RequestBodiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the synchronous BytesClient type.
 */
@ServiceClient(builder = BytesClientBuilder.class)
public final class RequestBodyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RequestBodiesImpl serviceClient;

    /**
     * Initializes an instance of RequestBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    RequestBodyClient(RequestBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(BinaryData value, long contentLength,
        RequestContext requestContext) {
        return this.serviceClient.defaultMethodWithResponse(value, contentLength, requestContext);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void defaultMethod(BinaryData value, long contentLength) {
        defaultMethodWithResponse(value, contentLength, RequestContext.none());
    }

    /**
     * The octetStream operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> octetStreamWithResponse(BinaryData value, long contentLength, RequestContext requestContext) {
        return this.serviceClient.octetStreamWithResponse(value, contentLength, requestContext);
    }

    /**
     * The octetStream operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void octetStream(BinaryData value, long contentLength) {
        octetStreamWithResponse(value, contentLength, RequestContext.none());
    }

    /**
     * The customContentType operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> customContentTypeWithResponse(BinaryData value, long contentLength,
        RequestContext requestContext) {
        return this.serviceClient.customContentTypeWithResponse(value, contentLength, requestContext);
    }

    /**
     * The customContentType operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void customContentType(BinaryData value, long contentLength) {
        customContentTypeWithResponse(value, contentLength, RequestContext.none());
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64WithResponse(byte[] value, RequestContext requestContext) {
        return this.serviceClient.base64WithResponse(value, requestContext);
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void base64(byte[] value) {
        base64WithResponse(value, RequestContext.none());
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlWithResponse(byte[] value, RequestContext requestContext) {
        return this.serviceClient.base64urlWithResponse(value, requestContext);
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void base64url(byte[] value) {
        base64urlWithResponse(value, RequestContext.none());
    }
}
