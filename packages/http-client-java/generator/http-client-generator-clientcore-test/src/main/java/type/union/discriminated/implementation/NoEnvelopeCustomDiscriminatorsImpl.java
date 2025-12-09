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
 * An instance of this class provides access to all the operations defined in NoEnvelopeCustomDiscriminators.
 */
public final class NoEnvelopeCustomDiscriminatorsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NoEnvelopeCustomDiscriminatorsService service;

    /**
     * The service client containing this operation class.
     */
    private final DiscriminatedClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NoEnvelopeCustomDiscriminatorsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NoEnvelopeCustomDiscriminatorsImpl(DiscriminatedClientImpl client) {
        this.service = NoEnvelopeCustomDiscriminatorsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DiscriminatedClientNoEnvelopeCustomDiscriminators to be used by the
     * proxy service to perform REST calls.
     */
    @ServiceInterface(name = "DiscriminatedClientNoEnvelopeCustomDiscriminators", host = "{endpoint}")
    public interface NoEnvelopeCustomDiscriminatorsService {
        static NoEnvelopeCustomDiscriminatorsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class
                    .forName("type.union.discriminated.implementation.NoEnvelopeCustomDiscriminatorsServiceImpl");
                return (NoEnvelopeCustomDiscriminatorsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/discriminated/no-envelope/custom-discriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> get(@HostParam("endpoint") String endpoint, @QueryParam("type") String type,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/union/discriminated/no-envelope/custom-discriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> put(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData input, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param type The type parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String type, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.get", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), type, accept, updatedContext);
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
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putWithResponse(BinaryData input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.put", requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.put(this.client.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }
}
