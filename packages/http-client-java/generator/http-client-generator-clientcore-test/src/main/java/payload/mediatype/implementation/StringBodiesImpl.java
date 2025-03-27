package payload.mediatype.implementation;

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
 * An instance of this class provides access to all the operations defined in StringBodies.
 */
public final class StringBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final MediaTypeClientImpl client;

    /**
     * Initializes an instance of StringBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringBodiesImpl(MediaTypeClientImpl client) {
        this.service = RestProxy.create(StringBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for MediaTypeClientStringBodies to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "MediaTypeClientStrin", host = "{endpoint}")
    public interface StringBodiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/payload/media-type/string-body/sendAsText",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendAsTextSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("text/plain") BinaryData text,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/media-type/string-body/getAsText",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<String> getAsTextSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/payload/media-type/string-body/sendAsJson",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendAsJsonSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData text,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/media-type/string-body/getAsJson",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<String> getAsJsonSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The sendAsText operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param text The text parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendAsTextWithResponse(BinaryData text, RequestOptions requestOptions) {
        final String contentType = "text/plain";
        return service.sendAsTextSync(this.client.getEndpoint(), contentType, text, requestOptions);
    }

    /**
     * The getAsText operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    public Response<String> getAsTextWithResponse(RequestOptions requestOptions) {
        final String accept = "text/plain";
        return service.getAsTextSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The sendAsJson operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param text The text parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendAsJsonWithResponse(BinaryData text, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendAsJsonSync(this.client.getEndpoint(), contentType, text, requestOptions);
    }

    /**
     * The getAsJson operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    public Response<String> getAsJsonWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getAsJsonSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
