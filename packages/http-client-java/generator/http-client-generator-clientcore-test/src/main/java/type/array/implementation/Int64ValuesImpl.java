package type.array.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
import java.util.List;

/**
 * An instance of this class provides access to all the operations defined in Int64Values.
 */
public final class Int64ValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final Int64ValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final ArrayClientImpl client;

    /**
     * Initializes an instance of Int64ValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    Int64ValuesImpl(ArrayClientImpl client) {
        this.service = RestProxy.create(Int64ValuesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ArrayClientInt64Values to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "ArrayClientInt64Valu", host = "{endpoint}")
    public interface Int64ValuesService {
        static Int64ValuesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.array.implementation.Int64ValuesServiceImpl");
                return (Int64ValuesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/type/array/int64", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<List<Long>> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.PUT, path = "/type/array/int64", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> put(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") List<Long> body, RequestContext requestContext);
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
    public Response<List<Long>> getWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public List<Long> get() {
        return getWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The put operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(List<Long> body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.put(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The put operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(List<Long> body) {
        putWithResponse(body, RequestContext.none());
    }
}
