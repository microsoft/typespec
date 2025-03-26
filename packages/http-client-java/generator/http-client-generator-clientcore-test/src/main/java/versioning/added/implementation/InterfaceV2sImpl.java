package versioning.added.implementation;

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
import versioning.added.AddedServiceVersion;
import versioning.added.ModelV2;
import versioning.added.Versions;

/**
 * An instance of this class provides access to all the operations defined in InterfaceV2s.
 */
public final class InterfaceV2sImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final InterfaceV2sService service;

    /**
     * The service client containing this operation class.
     */
    private final AddedClientImpl client;

    /**
     * Initializes an instance of InterfaceV2sImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    InterfaceV2sImpl(AddedClientImpl client) {
        this.service = RestProxy.create(InterfaceV2sService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public AddedServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    /**
     * The interface defining all the services for AddedClientInterfaceV2s to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "AddedClientInterface", host = "{endpoint}/versioning/added/api-version:{version}")
    public interface InterfaceV2sService {
        @HttpRequestInformation(method = HttpMethod.POST, path = "/interface-v2/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2InInterfaceSync(@HostParam("endpoint") String endpoint,
            @HostParam("version") Versions version, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * The v2InInterface operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<ModelV2> v2InInterfaceWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v2InInterfaceSync(this.client.getEndpoint(), this.client.getVersion(), contentType, accept, body,
            requestOptions);
    }
}
