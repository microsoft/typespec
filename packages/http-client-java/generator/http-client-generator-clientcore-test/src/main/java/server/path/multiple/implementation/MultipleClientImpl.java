package server.path.multiple.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import server.path.multiple.MultipleServiceVersion;

/**
 * Initializes a new instance of the MultipleClient type.
 */
public final class MultipleClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MultipleClientService service;

    /**
     * Pass in http://localhost:3000 for endpoint.
     */
    private final String endpoint;

    /**
     * Gets Pass in http://localhost:3000 for endpoint.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Service version.
     */
    private final MultipleServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public MultipleServiceVersion getServiceVersion() {
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
     * Initializes an instance of MultipleClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Pass in http://localhost:3000 for endpoint.
     * @param serviceVersion Service version.
     */
    public MultipleClientImpl(HttpPipeline httpPipeline, String endpoint, MultipleServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = RestProxy.create(MultipleClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for MultipleClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "MultipleClient", host = "{endpoint}/server/path/multiple/{apiVersion}")
    public interface MultipleClientService {
        @HttpRequestInformation(method = HttpMethod.GET, path = "/", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> noOperationParamsSync(@HostParam("endpoint") String endpoint,
            @HostParam("apiVersion") String apiVersion, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/{keyword}", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withOperationPathParamSync(@HostParam("endpoint") String endpoint,
            @HostParam("apiVersion") String apiVersion, @PathParam("keyword") String keyword,
            RequestOptions requestOptions);
    }

    /**
     * The noOperationParams operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> noOperationParamsWithResponse(RequestOptions requestOptions) {
        return service.noOperationParamsSync(this.getEndpoint(), this.getServiceVersion().getVersion(), requestOptions);
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withOperationPathParamWithResponse(String keyword, RequestOptions requestOptions) {
        return service.withOperationPathParamSync(this.getEndpoint(), this.getServiceVersion().getVersion(), keyword,
            requestOptions);
    }
}
