package routes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of InInterfacesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    InInterfacesImpl(RoutesClientImpl client) {
        this.service = InInterfacesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for RoutesClientInInterfaces to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "RoutesClientInInterfaces", host = "{endpoint}")
    public interface InInterfacesService {
        static InInterfacesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("routes.implementation.InInterfacesServiceImpl");
                return (InInterfacesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/in-interface/fixed",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> fixed(@HostParam("endpoint") String endpoint, RequestContext requestContext);
    }

    /**
     * The fixed operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fixedWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.InInterface.fixed", requestContext,
            updatedContext -> {
                return service.fixed(this.client.getEndpoint(), updatedContext);
            });
    }
}
