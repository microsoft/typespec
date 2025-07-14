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
import type.union.GetResponse;
import type.union.GetResponseProp;

/**
 * An instance of this class provides access to all the operations defined in StringsOnlies.
 */
public final class StringsOnliesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringsOnliesService service;

    /**
     * The service client containing this operation class.
     */
    private final UnionClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringsOnliesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringsOnliesImpl(UnionClientImpl client) {
        this.service = StringsOnliesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for UnionClientStringsOnlies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "UnionClientStringsOnlies", host = "{endpoint}")
    public interface StringsOnliesService {
        static StringsOnliesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.union.implementation.StringsOnliesServiceImpl");
                return (StringsOnliesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/strings-only",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<GetResponse> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/union/strings-only",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> send(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") SendRequest sendRequest, RequestContext requestContext);
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
    public Response<GetResponse> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.StringsOnly.get", requestContext,
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendWithResponse(GetResponseProp prop, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.StringsOnly.send", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                SendRequest sendRequest = new SendRequest(prop);
                return service.send(this.client.getEndpoint(), contentType, sendRequest, updatedContext);
            });
    }
}
