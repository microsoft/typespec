package type.union.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
import type.union.GetResponse3;
import type.union.GetResponseProp2;

/**
 * An instance of this class provides access to all the operations defined in IntsOnlies.
 */
public final class IntsOnliesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final IntsOnliesService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * Initializes an instance of IntsOnliesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    IntsOnliesImpl(UnionClientImpl client) {
        this.service = IntsOnliesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for UnionClientIntsOnlies to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "UnionClientIntsOnlies", host = "{endpoint}")
    public interface IntsOnliesService {
        static IntsOnliesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.union.implementation.IntsOnliesServiceImpl");
                return (IntsOnliesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/type/union/ints-only", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse3> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/type/union/ints-only", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> send(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") SendRequest3 sendRequest3, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<GetResponse3> getWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * The send operation.
     * 
     * @param prop The prop parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendWithResponse(GetResponseProp2 prop, RequestContext requestContext) {
        final String contentType = "application/json";
        SendRequest3 sendRequest3 = new SendRequest3(prop);
        return service.send(this.client.getEndpoint(), contentType, sendRequest3, requestContext);
    }
}
