package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.multipart.formdata.file.UploadFileArrayRequest;
import payload.multipart.formdata.file.UploadFileRequiredFilenameRequest;
import payload.multipart.formdata.file.UploadFileSpecificContentTypeRequest;
import payload.multipart.implementation.FormDataFilesImpl;

/**
 * Initializes a new instance of the synchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class)
public final class FormDataFileClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FormDataFilesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataFileClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FormDataFileClient(FormDataFilesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(UploadFileSpecificContentTypeRequest body,
        RequestContext requestContext) {
        // Operation 'uploadFileSpecificContentType' is of content-type 'multipart/form-data'. Protocol API is not
        // usable and hence not generated.
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.File.uploadFileSpecificContentType", requestContext,
            updatedContext -> this.serviceClient.uploadFileSpecificContentTypeWithResponse(body, updatedContext));
    }

    /**
     * The uploadFileSpecificContentType operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileSpecificContentType(UploadFileSpecificContentTypeRequest body) {
        uploadFileSpecificContentTypeWithResponse(body, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileRequiredFilenameWithResponse(UploadFileRequiredFilenameRequest body,
        RequestContext requestContext) {
        // Operation 'uploadFileRequiredFilename' is of content-type 'multipart/form-data'. Protocol API is not usable
        // and hence not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileRequiredFilename",
            requestContext,
            updatedContext -> this.serviceClient.uploadFileRequiredFilenameWithResponse(body, updatedContext));
    }

    /**
     * The uploadFileRequiredFilename operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileRequiredFilename(UploadFileRequiredFilenameRequest body) {
        uploadFileRequiredFilenameWithResponse(body, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileArrayWithResponse(UploadFileArrayRequest body, RequestContext requestContext) {
        // Operation 'uploadFileArray' is of content-type 'multipart/form-data'. Protocol API is not usable and hence
        // not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileArray",
            requestContext, updatedContext -> this.serviceClient.uploadFileArrayWithResponse(body, updatedContext));
    }

    /**
     * The uploadFileArray operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void uploadFileArray(UploadFileArrayRequest body) {
        uploadFileArrayWithResponse(body, RequestContext.none());
    }
}
