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
import payload.multipart.implementation.FormDataHttpPartsContentTypesImpl;

/**
 * Initializes a new instance of the synchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class)
public final class FormDataHttpPartsContentTypeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FormDataHttpPartsContentTypesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataHttpPartsContentTypeClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FormDataHttpPartsContentTypeClient(FormDataHttpPartsContentTypesImpl serviceClient,
        Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Test content-type: multipart/form-data.
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
    public Response<Void> imageJpegContentTypeWithResponse(FileWithHttpPartSpecificContentTypeRequest body,
        RequestContext requestContext) {
        // Operation 'imageJpegContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.imageJpegContentType", requestContext,
            updatedContext -> this.serviceClient.imageJpegContentTypeWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void imageJpegContentType(FileWithHttpPartSpecificContentTypeRequest body) {
        imageJpegContentTypeWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data.
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
    public Response<Void> requiredContentTypeWithResponse(FileWithHttpPartRequiredContentTypeRequest body,
        RequestContext requestContext) {
        // Operation 'requiredContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.requiredContentType", requestContext,
            updatedContext -> this.serviceClient.requiredContentTypeWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requiredContentType(FileWithHttpPartRequiredContentTypeRequest body) {
        requiredContentTypeWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
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
    public Response<Void> optionalContentTypeWithResponse(FileWithHttpPartOptionalContentTypeRequest body,
        RequestContext requestContext) {
        // Operation 'optionalContentType' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.optionalContentType", requestContext,
            updatedContext -> this.serviceClient.optionalContentTypeWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void optionalContentType(FileWithHttpPartOptionalContentTypeRequest body) {
        optionalContentTypeWithResponse(body, RequestContext.none());
    }
}
