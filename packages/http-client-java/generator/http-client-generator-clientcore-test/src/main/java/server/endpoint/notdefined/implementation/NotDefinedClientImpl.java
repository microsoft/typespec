package server.endpoint.notdefined.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the NotDefinedClient type.
 */
public final class NotDefinedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotDefinedClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
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
     * Initializes an instance of NotDefinedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public NotDefinedClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(NotDefinedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for NotDefinedClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "NotDefinedClient", host = "{endpoint}")
    public interface NotDefinedClientService {
        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/endpoint/not-defined/valid",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> validSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * The valid operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> validWithResponse(RequestOptions requestOptions) {
        return service.validSync(this.getEndpoint(), requestOptions);
    }
}
