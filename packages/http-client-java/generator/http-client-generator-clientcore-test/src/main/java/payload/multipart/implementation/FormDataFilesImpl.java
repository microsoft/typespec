package payload.multipart.implementation;

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
import java.lang.reflect.InvocationTargetException;
import payload.multipart.formdata.file.UploadFileArrayRequest;
import payload.multipart.formdata.file.UploadFileRequiredFilenameRequest;
import payload.multipart.formdata.file.UploadFileSpecificContentTypeRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataFiles.
 */
public final class FormDataFilesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataFilesService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataFilesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataFilesImpl(MultiPartClientImpl client) {
        this.service = FormDataFilesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for MultiPartClientFormDataFiles to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormDataFiles", host = "{endpoint}")
    public interface FormDataFilesService {
        static FormDataFilesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.multipart.implementation.FormDataFilesServiceImpl");
                return (FormDataFilesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/file/specific-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileSpecificContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") UploadFileSpecificContentTypeRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/file/required-filename",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileRequiredFilename(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") UploadFileRequiredFilenameRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/file/file-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> uploadFileArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") UploadFileArrayRequest body, RequestContext requestContext);
    }

    /**
     * The uploadFileSpecificContentType operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(UploadFileSpecificContentTypeRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.File.uploadFileSpecificContentType", requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileSpecificContentType(this.client.getEndpoint(), contentType, body,
                    updatedContext);
            });
    }

    /**
     * The uploadFileRequiredFilename operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileRequiredFilenameWithResponse(UploadFileRequiredFilenameRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileRequiredFilename",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileRequiredFilename(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * The uploadFileArray operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileArrayWithResponse(UploadFileArrayRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileArray",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileArray(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
