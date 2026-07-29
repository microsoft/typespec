package parameters.basic.implementation;

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
import parameters.basic.explicitbody.User;

/**
 * An instance of this class provides access to all the operations defined in ExplicitBodies.
 */
public final class ExplicitBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExplicitBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BasicClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExplicitBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExplicitBodiesImpl(BasicClientImpl client) {
        this.service = ExplicitBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for BasicClientExplicitBodies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "BasicClientExplicitBodies", host = "{endpoint}")
    public interface ExplicitBodiesService {
        static ExplicitBodiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("parameters.basic.implementation.ExplicitBodiesServiceImpl");
                return (ExplicitBodiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/basic/explicit-body/simple",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> simple(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") User body, RequestContext requestContext);
    }

    /**
     * The simple operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> simpleWithResponse(User body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Basic.ExplicitBody.simple", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.simple(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
