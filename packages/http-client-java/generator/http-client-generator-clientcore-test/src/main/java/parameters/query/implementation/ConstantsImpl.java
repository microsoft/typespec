package parameters.query.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in Constants.
 */
public final class ConstantsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ConstantsService service;

    /**
     * The service client containing this operation class.
     */
    private final QueryClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ConstantsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ConstantsImpl(QueryClientImpl client) {
        this.service = ConstantsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for QueryClientConstants to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "QueryClientConstants", host = "{endpoint}")
    public interface ConstantsService {
        static ConstantsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("parameters.query.implementation.ConstantsServiceImpl");
                return (ConstantsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/query/constant",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> post(@HostParam("endpoint") String endpoint, @QueryParam("queryParam") String queryParam,
            RequestContext requestContext);
    }

    /**
     * post constant query value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.Constant.post", requestContext,
            updatedContext -> {
                final String queryParam = "constantValue";
                return service.post(this.client.getEndpoint(), queryParam, updatedContext);
            });
    }
}
