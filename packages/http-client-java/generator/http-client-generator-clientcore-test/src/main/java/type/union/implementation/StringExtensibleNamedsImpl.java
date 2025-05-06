package type.union.implementation;

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
import type.union.GetResponse2;

/**
 * An instance of this class provides access to all the operations defined in StringExtensibleNameds.
 */
public final class StringExtensibleNamedsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringExtensibleNamedsService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of StringExtensibleNamedsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringExtensibleNamedsImpl(UnionClientImpl client) {
        this.service = RestProxy.create(StringExtensibleNamedsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for UnionClientStringExtensibleNameds to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "UnionClientStringExt", host = "{endpoint}")
    public interface StringExtensibleNamedsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/string-extensible-named",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse2> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/string-extensible-named",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest2, RequestOptions requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String(b/c) (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<GetResponse2> getWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String(b/c) (Required)
     * }
     * }
     * </pre>
     * 
     * @param sendRequest2 The sendRequest2 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendWithResponse(BinaryData sendRequest2, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendSync(this.client.getEndpoint(), contentType, sendRequest2, requestOptions);
    }
}
