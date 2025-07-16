package type.union.discriminated.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
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
import io.clientcore.core.models.binarydata.BinaryData;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in NoEnvelopeDefaults.
 */
public final class NoEnvelopeDefaultsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NoEnvelopeDefaultsService service;

    /**
     * The service client containing this operation class.
     */
    private final DiscriminatedClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NoEnvelopeDefaultsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NoEnvelopeDefaultsImpl(DiscriminatedClientImpl client) {
        this.service = NoEnvelopeDefaultsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DiscriminatedClientNoEnvelopeDefaults to be used by the proxy service
     * to perform REST calls.
     */
    @ServiceInterface(name = "DiscriminatedClientNoEnvelopeDefaults", host = "{endpoint}")
    public interface NoEnvelopeDefaultsService {
        static NoEnvelopeDefaultsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.union.discriminated.implementation.NoEnvelopeDefaultsServiceImpl");
                return (NoEnvelopeDefaultsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/discriminated/no-envelope/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> get(@HostParam("endpoint") String endpoint, @QueryParam("kind") String kind,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/union/discriminated/no-envelope/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> put(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData input, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param kind The kind parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String kind, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.NoEnvelope.Default.get",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), kind, accept, updatedContext);
            });
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putWithResponse(BinaryData input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.NoEnvelope.Default.put",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.put(this.client.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }
}
