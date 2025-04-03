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
import type.union.GetResponse9;

/**
 * An instance of this class provides access to all the operations defined in MixedTypes.
 */
public final class MixedTypesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MixedTypesService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of MixedTypesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    MixedTypesImpl(UnionClientImpl client) {
        this.service = RestProxy.create(MixedTypesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for UnionClientMixedTypes to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "UnionClientMixedType", host = "{endpoint}")
    public interface MixedTypesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/mixed-types",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse9> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/mixed-types",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData sendRequest9, RequestOptions requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop (Required): {
     *         model: BinaryData (Required)
     *         literal: BinaryData (Required)
     *         int: BinaryData (Required)
     *         boolean: BinaryData (Required)
     *         array (Required): [
     *             BinaryData (Required)
     *         ]
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<GetResponse9> getWithResponse(RequestOptions requestOptions) {
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
     *         model: BinaryData (Required)
     *         literal: BinaryData (Required)
     *         int: BinaryData (Required)
     *         boolean: BinaryData (Required)
     *         array (Required): [
     *             BinaryData (Required)
     *         ]
     *     }
     * }
     * }
     * </pre>
     * 
     * @param sendRequest9 The sendRequest9 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendWithResponse(BinaryData sendRequest9, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sendSync(this.client.getEndpoint(), contentType, sendRequest9, requestOptions);
    }
}
