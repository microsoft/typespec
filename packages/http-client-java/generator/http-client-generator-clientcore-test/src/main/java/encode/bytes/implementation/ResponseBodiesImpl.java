package encode.bytes.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.utils.Base64Uri;

/**
 * An instance of this class provides access to all the operations defined in ResponseBodies.
 */
public final class ResponseBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ResponseBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * Initializes an instance of ResponseBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ResponseBodiesImpl(BytesClientImpl client) {
        this.service = RestProxy.create(ResponseBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for BytesClientResponseBodies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "BytesClientResponseB", host = "{endpoint}")
    public interface ResponseBodiesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/octet-stream",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> octetStreamSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/custom-content-type",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> customContentTypeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/base64",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<byte[]> base64Sync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/base64url",
            expectedStatusCodes = { 200 },
            returnValueWireType = Base64Uri.class)
        @UnexpectedResponseExceptionDetail
        Response<byte[]> base64urlSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<BinaryData> defaultMethodWithResponse(RequestOptions requestOptions) {
        final String accept = "application/octet-stream";
        return service.defaultMethodSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The octetStream operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<BinaryData> octetStreamWithResponse(RequestOptions requestOptions) {
        final String accept = "application/octet-stream";
        return service.octetStreamSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The customContentType operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<BinaryData> customContentTypeWithResponse(RequestOptions requestOptions) {
        final String accept = "image/png";
        return service.customContentTypeSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The base64 operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return represent a byte array.
     */
    public Response<byte[]> base64WithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.base64Sync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The base64url operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Uri
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<byte[]> base64urlWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.base64urlSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
