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
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import type.union.GetResponse1;
import type.union.GetResponseProp1;

/**
 * An instance of this class provides access to all the operations defined in StringExtensibles.
 */
public final class StringExtensiblesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringExtensiblesService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringExtensiblesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringExtensiblesImpl(UnionClientImpl client) {
        this.service = StringExtensiblesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for UnionClientStringExtensibles to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "UnionClientStringExtensibles", host = "{endpoint}")
    public interface StringExtensiblesService {
        static StringExtensiblesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.union.implementation.StringExtensiblesServiceImpl");
                return (StringExtensiblesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/string-extensible",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse1> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/string-extensible",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> send(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") SendRequest1 sendRequest1, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<GetResponse1> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.StringExtensible.get", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The send operation.
     * 
     * @param prop The prop parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendWithResponse(GetResponseProp1 prop, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.StringExtensible.send", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                SendRequest1 sendRequest1 = new SendRequest1(prop);
                return service.send(this.client.getEndpoint(), contentType, sendRequest1, updatedContext);
            });
    }
}
