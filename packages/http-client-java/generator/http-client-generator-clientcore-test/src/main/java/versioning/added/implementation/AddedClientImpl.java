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
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.added.AddedServiceVersion;
import versioning.added.ModelV1;
import versioning.added.ModelV2;
import versioning.added.Versions;

/**
 * Initializes a new instance of the AddedClient type.
 */
public final class AddedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final AddedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Need to be set as 'v1' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
    }

    /**
     * Service version.
     */
    private final AddedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public AddedServiceVersion getServiceVersion() {
        return this.serviceVersion;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The InterfaceV2sImpl object to access its operations.
     */
    private final InterfaceV2sImpl interfaceV2s;

    /**
     * Gets the InterfaceV2sImpl object to access its operations.
     * 
     * @return the InterfaceV2sImpl object.
     */
    public InterfaceV2sImpl getInterfaceV2s() {
        return this.interfaceV2s;
    }

    /**
     * Initializes an instance of AddedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public AddedClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        AddedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.interfaceV2s = new InterfaceV2sImpl(this);
        this.service = RestProxy.create(AddedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for AddedClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "AddedClient", host = "{endpoint}/versioning/added/api-version:{version}")
    public interface AddedClientService {
        @HttpRequestInformation(method = HttpMethod.POST, path = "/v1", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV1> v1Sync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("header-v2") String headerV2, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2Sync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
    }

    /**
     * The v1 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2) (Required)
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
     *     enumProp: String(enumMemberV1/enumMemberV2) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<ModelV1> v1WithResponse(String headerV2, BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v1Sync(this.getEndpoint(), this.getVersion(), headerV2, contentType, accept, body,
            requestOptions);
    }

    /**
     * The v2 operation.
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
    public Response<ModelV2> v2WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v2Sync(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestOptions);
    }
}
