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
import type.union.GetResponse8;

/**
 * An instance of this class provides access to all the operations defined in MixedLiterals.
 */
public final class MixedLiteralsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MixedLiteralsService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of MixedLiteralsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    MixedLiteralsImpl(UnionClientImpl client) {
        this.service = RestProxy.create(MixedLiteralsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for UnionClientMixedLiterals to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "UnionClientMixedLite", host = "{endpoint}")
    public interface MixedLiteralsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/mixed-literals",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse8> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/mixed-literals",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest8, RequestOptions requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop (Required): {
     *         stringLiteral: BinaryData (Required)
     *         intLiteral: BinaryData (Required)
     *         floatLiteral: BinaryData (Required)
     *         booleanLiteral: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<GetResponse8> getWithResponse(RequestOptions requestOptions) {
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
     *         stringLiteral: BinaryData (Required)
     *         intLiteral: BinaryData (Required)
     *         floatLiteral: BinaryData (Required)
     *         booleanLiteral: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param sendRequest8 The sendRequest8 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendWithResponse(BinaryData sendRequest8, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendSync(this.client.getEndpoint(), contentType, sendRequest8, requestOptions);
    }
}
