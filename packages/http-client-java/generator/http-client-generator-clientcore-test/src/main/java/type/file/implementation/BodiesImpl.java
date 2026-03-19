package type.file.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.models.binarydata.BinaryData;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in Bodies.
 */
public final class BodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final FileClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BodiesImpl(FileClientImpl client) {
        this.service = BodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for FileClientBodies to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "FileClientBodies", host = "{endpoint}")
    public interface BodiesService {
        static BodiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.file.implementation.BodiesServiceImpl");
                return (BodiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/file/body/request/specific-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileSpecificContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("image/png") BinaryData file,
            @HeaderParam("Content-Length") long contentLength, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/file/body/request/json-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileJsonContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData file,
            @HeaderParam("Content-Length") long contentLength, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/file/body/response/json-content-type",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> downloadFileJsonContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/file/body/response/specific-content-type",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> downloadFileSpecificContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/file/body/request/multiple-content-types",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileMultipleContentTypes(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData file,
            @HeaderParam("Content-Length") long contentLength, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/file/body/response/multiple-content-types",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> downloadFileMultipleContentTypes(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/file/body/request/default-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileDefaultContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("*/*") BinaryData file,
            @HeaderParam("Content-Length") long contentLength, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/file/body/response/default-content-type",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> downloadFileDefaultContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileSpecificContentType",
            requestContext, updatedContext -> {
                return service.uploadFileSpecificContentType(this.client.getEndpoint(), contentType, file,
                    contentLength, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileJsonContentTypeWithResponse(BinaryData file, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileJsonContentType", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.uploadFileJsonContentType(this.client.getEndpoint(), contentType, file, contentLength,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileJsonContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileJsonContentType", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.downloadFileJsonContentType(this.client.getEndpoint(), accept, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileSpecificContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileSpecificContentType",
            requestContext, updatedContext -> {
                final String accept = "image/png";
                return service.downloadFileSpecificContentType(this.client.getEndpoint(), accept, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileMultipleContentTypesWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileMultipleContentTypes",
            requestContext, updatedContext -> {
                return service.uploadFileMultipleContentTypes(this.client.getEndpoint(), contentType, file,
                    contentLength, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileMultipleContentTypesWithResponse(String accept,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileMultipleContentTypes",
            requestContext, updatedContext -> {
                return service.downloadFileMultipleContentTypes(this.client.getEndpoint(), accept, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileDefaultContentTypeWithResponse(String contentType, BinaryData file,
        long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileDefaultContentType",
            requestContext, updatedContext -> {
                return service.uploadFileDefaultContentType(this.client.getEndpoint(), contentType, file, contentLength,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileDefaultContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileDefaultContentType",
            requestContext, updatedContext -> {
                final String accept = "*/*";
                return service.downloadFileDefaultContentType(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
