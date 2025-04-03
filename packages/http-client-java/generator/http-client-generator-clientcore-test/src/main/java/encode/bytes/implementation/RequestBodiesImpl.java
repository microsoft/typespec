package encode.bytes.implementation;

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
 * An instance of this class provides access to all the operations defined in RequestBodies.
 */
public final class RequestBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RequestBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * Initializes an instance of RequestBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RequestBodiesImpl(BytesClientImpl client) {
        this.service = RestProxy.create(RequestBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for BytesClientRequestBodies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "BytesClientRequestBo", host = "{endpoint}")
    public interface RequestBodiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/body/request/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/octet-stream") BinaryData value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/body/request/octet-stream",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> octetStreamSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/octet-stream") BinaryData value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/body/request/custom-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> customContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("image/png") BinaryData value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/body/request/base64",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/body/request/base64url",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64urlSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData value,
            RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/octet-stream";
        return service.defaultMethodSync(this.client.getEndpoint(), contentType, value, requestOptions);
    }

    /**
     * The octetStream operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> octetStreamWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/octet-stream";
        return service.octetStreamSync(this.client.getEndpoint(), contentType, value, requestOptions);
    }

    /**
     * The customContentType operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> customContentTypeWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "image/png";
        return service.customContentTypeSync(this.client.getEndpoint(), contentType, value, requestOptions);
    }

    /**
     * The base64 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> base64WithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.base64Sync(this.client.getEndpoint(), contentType, value, requestOptions);
    }

    /**
     * The base64url operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Uri
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> base64urlWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.base64urlSync(this.client.getEndpoint(), contentType, value, requestOptions);
    }
}
