package payload.multipart.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

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
        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-specific-content-type-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> imageJpegContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-required-content-type-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/file-with-http-part-optional-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> optionalContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> imageJpegContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.imageJpegContentTypeSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> requiredContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.requiredContentTypeSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> optionalContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.optionalContentTypeSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
