package type.scalar.implementation;

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
import java.math.BigDecimal;
import java.util.List;

/**
 * An instance of this class provides access to all the operations defined in DecimalVerifies.
 */
public final class DecimalVerifiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DecimalVerifiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of DecimalVerifiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DecimalVerifiesImpl(ScalarClientImpl client) {
        this.service = DecimalVerifiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for ScalarClientDecimalVerifies to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "ScalarClientDecimalVerifies", host = "{endpoint}")
    public interface DecimalVerifiesService {
        static DecimalVerifiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.scalar.implementation.DecimalVerifiesServiceImpl");
                return (DecimalVerifiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal/prepare_verify",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<List<BigDecimal>> prepareVerify(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/scalar/decimal/verify",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> verify(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("application/json") BigDecimal body, RequestContext requestContext);
    }

    /**
     * The prepareVerify operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<List<BigDecimal>> prepareVerifyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.DecimalVerify.prepareVerify", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.prepareVerify(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The verify operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> verifyWithResponse(BigDecimal body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.DecimalVerify.verify", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.verify(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
