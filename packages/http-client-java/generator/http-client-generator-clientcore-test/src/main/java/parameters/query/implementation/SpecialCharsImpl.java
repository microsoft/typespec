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
 * An instance of this class provides access to all the operations defined in SpecialChars.
 */
public final class SpecialCharsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SpecialCharsService service;

    /**
     * The service client containing this operation class.
     */
    private final QueryClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of SpecialCharsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    SpecialCharsImpl(QueryClientImpl client) {
        this.service = SpecialCharsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for QueryClientSpecialChars to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "QueryClientSpecialChars", host = "{endpoint}")
    public interface SpecialCharsService {
        static SpecialCharsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("parameters.query.implementation.SpecialCharsServiceImpl");
                return (SpecialCharsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/query/special-char/dollarSign",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> dollarSign(@HostParam("endpoint") String endpoint, @QueryParam("$filter") String filter,
            RequestContext requestContext);
    }

    /**
     * The dollarSign operation.
     * 
     * @param filter The filter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> dollarSignWithResponse(String filter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.SpecialChar.dollarSign", requestContext,
            updatedContext -> {
                return service.dollarSign(this.client.getEndpoint(), filter, updatedContext);
            });
    }
}
