package payload.multipart.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
import java.lang.reflect.InvocationTargetException;
import payload.multipart.FileWithHttpPartOptionalContentTypeRequest;
import payload.multipart.FileWithHttpPartRequiredContentTypeRequest;
import payload.multipart.FileWithHttpPartSpecificContentTypeRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataHttpPartsContentTypes.
 */
public final class FormDataHttpPartsContentTypesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsContentTypesService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * Initializes an instance of FormDataHttpPartsContentTypesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsContentTypesImpl(MultiPartClientImpl client) {
        this.service = RestProxy.create(FormDataHttpPartsContentTypesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for MultiPartClientFormDataHttpPartsContentTypes to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormD", host = "{endpoint}")
    public interface FormDataHttpPartsContentTypesService {
        static FormDataHttpPartsContentTypesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("payload.multipart.implementation.FormDataHttpPartsContentTypesServiceImpl");
                return (FormDataHttpPartsContentTypesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-specific-content-type-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> imageJpegContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") FileWithHttpPartSpecificContentTypeRequest body,
            RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-required-content-type-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") FileWithHttpPartRequiredContentTypeRequest body,
            RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/file-with-http-part-optional-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> optionalContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") FileWithHttpPartOptionalContentTypeRequest body,
            RequestContext requestContext);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> imageJpegContentTypeWithResponse(FileWithHttpPartSpecificContentTypeRequest body,
        RequestContext requestContext) {
        final String contentType = "multipart/form-data";
        return service.imageJpegContentType(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredContentTypeWithResponse(FileWithHttpPartRequiredContentTypeRequest body,
        RequestContext requestContext) {
        final String contentType = "multipart/form-data";
        return service.requiredContentType(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> optionalContentTypeWithResponse(FileWithHttpPartOptionalContentTypeRequest body,
        RequestContext requestContext) {
        final String contentType = "multipart/form-data";
        return service.optionalContentType(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void optionalContentType(FileWithHttpPartOptionalContentTypeRequest body) {
        optionalContentTypeWithResponse(body, RequestContext.none());
    }
}
