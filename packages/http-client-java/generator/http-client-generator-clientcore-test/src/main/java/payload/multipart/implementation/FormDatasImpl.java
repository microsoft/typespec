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
 * An instance of this class provides access to all the operations defined in FormDatas.
 */
public final class FormDatasImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDatasService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * Initializes an instance of FormDatasImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDatasImpl(MultiPartClientImpl client) {
        this.service = RestProxy.create(FormDatasService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for MultiPartClientFormDatas to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormD", host = "{endpoint}")
    public interface FormDatasService {
        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/mixed-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> basicSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/complex-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> fileArrayAndBasicSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/json-part",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> jsonPartSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/binary-array-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> binaryArrayPartsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/multi-binary-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> multiBinaryPartsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> checkFileNameAndContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/anonymous-model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> anonymousModelSync(@HostParam("endpoint") String endpoint,
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
    public Response<Void> basicWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.basicSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> fileArrayAndBasicWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.fileArrayAndBasicSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for scenario contains json part and binary part.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> jsonPartWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.jsonPartSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> binaryArrayPartsWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.binaryArrayPartsSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> multiBinaryPartsWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.multiBinaryPartsSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> checkFileNameAndContentTypeWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.checkFileNameAndContentTypeSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> anonymousModelWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.anonymousModelSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
