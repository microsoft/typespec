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
import type.union.GetResponse7;

/**
 * An instance of this class provides access to all the operations defined in StringAndArrays.
 */
public final class StringAndArraysImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringAndArraysService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of StringAndArraysImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringAndArraysImpl(UnionClientImpl client) {
        this.service = RestProxy.create(StringAndArraysService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for UnionClientStringAndArrays to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "UnionClientStringAnd", host = "{endpoint}")
    public interface StringAndArraysService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/string-and-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse7> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/string-and-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest7, RequestOptions requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop (Required): {
     *         string: BinaryData (Required)
     *         array: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<GetResponse7> getWithResponse(RequestOptions requestOptions) {
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
     *     prop (Required): {
     *         string: BinaryData (Required)
     *         array: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param sendRequest7 The sendRequest7 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendWithResponse(BinaryData sendRequest7, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendSync(this.client.getEndpoint(), contentType, sendRequest7, requestOptions);
    }
}
