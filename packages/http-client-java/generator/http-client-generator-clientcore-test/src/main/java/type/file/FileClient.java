package type.file;

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
import type.file.implementation.BodiesImpl;

/**
 * Initializes a new instance of the synchronous FileClient type.
 */
@ServiceClient(builder = FileClientBuilder.class)
public final class FileClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BodiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FileClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FileClient(BodiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The uploadFileSpecificContentType operation.
     * 
     * @param contentType Body parameter's content type. Known values are image/png.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileSpecificContentType",
            requestContext, updatedContext -> this.serviceClient.uploadFileSpecificContentTypeWithResponse(contentType,
                file, contentLength, updatedContext));
    }

    /**
     * The uploadFileSpecificContentType operation.
     * 
     * @param contentType Body parameter's content type. Known values are image/png.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileSpecificContentType(String contentType, BinaryData file, long contentLength) {
        uploadFileSpecificContentTypeWithResponse(contentType, file, contentLength, RequestContext.none());
    }

    /**
     * The uploadFileJsonContentType operation.
     * 
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileJsonContentTypeWithResponse(BinaryData file, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileJsonContentType", requestContext,
            updatedContext -> this.serviceClient.uploadFileJsonContentTypeWithResponse(file, contentLength,
                updatedContext));
    }

    /**
     * The uploadFileJsonContentType operation.
     * 
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileJsonContentType(BinaryData file, long contentLength) {
        uploadFileJsonContentTypeWithResponse(file, contentLength, RequestContext.none());
    }

    /**
     * The downloadFileJsonContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileJsonContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileJsonContentType", requestContext,
            updatedContext -> this.serviceClient.downloadFileJsonContentTypeWithResponse(updatedContext));
    }

    /**
     * The downloadFileJsonContentType operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData downloadFileJsonContentType() {
        return downloadFileJsonContentTypeWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The downloadFileSpecificContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileSpecificContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileSpecificContentType",
            requestContext,
            updatedContext -> this.serviceClient.downloadFileSpecificContentTypeWithResponse(updatedContext));
    }

    /**
     * The downloadFileSpecificContentType operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData downloadFileSpecificContentType() {
        return downloadFileSpecificContentTypeWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The uploadFileMultipleContentTypes operation.
     * 
     * @param contentType Body parameter's content type. Known values are image/png,image/jpeg.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileMultipleContentTypesWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileMultipleContentTypes",
            requestContext, updatedContext -> this.serviceClient.uploadFileMultipleContentTypesWithResponse(contentType,
                file, contentLength, updatedContext));
    }

    /**
     * The uploadFileMultipleContentTypes operation.
     * 
     * @param contentType Body parameter's content type. Known values are image/png,image/jpeg.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileMultipleContentTypes(String contentType, BinaryData file, long contentLength) {
        uploadFileMultipleContentTypesWithResponse(contentType, file, contentLength, RequestContext.none());
    }

    /**
     * The downloadFileMultipleContentTypes operation.
     * 
     * @param accept The accept parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileMultipleContentTypesWithResponse(String accept,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileMultipleContentTypes",
            requestContext,
            updatedContext -> this.serviceClient.downloadFileMultipleContentTypesWithResponse(accept, updatedContext));
    }

    /**
     * The downloadFileMultipleContentTypes operation.
     * 
     * @param accept The accept parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData downloadFileMultipleContentTypes(String accept) {
        return downloadFileMultipleContentTypesWithResponse(accept, RequestContext.none()).getValue();
    }

    /**
     * The uploadFileDefaultContentType operation.
     * 
     * @param contentType Body parameter's content type. Known values are *&#47;*.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileDefaultContentTypeWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileDefaultContentType",
            requestContext, updatedContext -> this.serviceClient.uploadFileDefaultContentTypeWithResponse(contentType,
                file, contentLength, updatedContext));
    }

    /**
     * The uploadFileDefaultContentType operation.
     * 
     * @param contentType Body parameter's content type. Known values are *&#47;*.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileDefaultContentType(String contentType, BinaryData file, long contentLength) {
        uploadFileDefaultContentTypeWithResponse(contentType, file, contentLength, RequestContext.none());
    }

    /**
     * The downloadFileDefaultContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileDefaultContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileDefaultContentType",
            requestContext,
            updatedContext -> this.serviceClient.downloadFileDefaultContentTypeWithResponse(updatedContext));
    }

    /**
     * The downloadFileDefaultContentType operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData downloadFileDefaultContentType() {
        return downloadFileDefaultContentTypeWithResponse(RequestContext.none()).getValue();
    }
}
