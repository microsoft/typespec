package encode.bytes.implementation;

import encode.bytes.Base64BytesProperty;
import encode.bytes.Base64urlArrayBytesProperty;
import encode.bytes.Base64urlBytesProperty;
import encode.bytes.DefaultBytesProperty;
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
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(BytesClientImpl client) {
        this.service = RestProxy.create(PropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for BytesClientProperties to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BytesClientPropertie", host = "{endpoint}")
    public interface PropertiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultBytesProperty> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64BytesProperty> base64Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64url",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64urlBytesProperty> base64urlSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64url-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64urlArrayBytesProperty> base64urlArraySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<DefaultBytesProperty> defaultMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.defaultMethodSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The base64 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Base64BytesProperty> base64WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.base64Sync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The base64url operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Base64Uri (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Base64Uri (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Base64urlBytesProperty> base64urlWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.base64urlSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The base64urlArray operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *         Base64Uri (Required)
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *         Base64Uri (Required)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Base64urlArrayBytesProperty> base64urlArrayWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.base64urlArraySync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }
}
