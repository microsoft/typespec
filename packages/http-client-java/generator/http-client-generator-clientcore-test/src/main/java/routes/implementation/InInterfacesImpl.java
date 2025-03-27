package routes.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * An instance of this class provides access to all the operations defined in InInterfaces.
 */
public final class InInterfacesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final InInterfacesService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * Initializes an instance of InInterfacesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    InInterfacesImpl(RoutesClientImpl client) {
        this.service = RestProxy.create(InInterfacesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientInInterfaces to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "RoutesClientInInterf", host = "{endpoint}")
    public interface InInterfacesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/in-interface/fixed",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> fixedSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * The fixed operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> fixedWithResponse(RequestOptions requestOptions) {
        return service.fixedSync(this.client.getEndpoint(), requestOptions);
    }
}
