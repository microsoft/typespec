package versioning.renamedfrom.implementation;

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
import versioning.renamedfrom.NewModel;
import versioning.renamedfrom.RenamedFromServiceVersion;
import versioning.renamedfrom.Versions;

/**
 * An instance of this class provides access to all the operations defined in NewInterfaces.
 */
public final class NewInterfacesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NewInterfacesService service;

    /**
     * The service client containing this operation class.
     */
    private final RenamedFromClientImpl client;

    /**
     * Initializes an instance of NewInterfacesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NewInterfacesImpl(RenamedFromClientImpl client) {
        this.service = RestProxy.create(NewInterfacesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RenamedFromServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    /**
     * The interface defining all the services for RenamedFromClientNewInterfaces to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "RenamedFromClientNew", host = "{endpoint}/versioning/renamed-from/api-version:{version}")
    public interface NewInterfacesService {
        @HttpRequestInformation(method = HttpMethod.POST, path = "/interface/test", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewModel> newOpInNewInterfaceSync(@HostParam("endpoint") String endpoint,
            @HostParam("version") Versions version, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * The newOpInNewInterface operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
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
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
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
    public Response<NewModel> newOpInNewInterfaceWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.newOpInNewInterfaceSync(this.client.getEndpoint(), this.client.getVersion(), contentType, accept,
            body, requestOptions);
    }
}
