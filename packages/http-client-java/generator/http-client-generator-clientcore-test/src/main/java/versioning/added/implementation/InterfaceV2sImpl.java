package versioning.added.implementation;

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
import versioning.added.AddedServiceVersion;
import versioning.added.ModelV2;

/**
 * An instance of this class provides access to all the operations defined in InterfaceV2s.
 */
public final class InterfaceV2sImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final InterfaceV2sService service;

    /**
     * The service client containing this operation class.
     */
    private final AddedClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of InterfaceV2sImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    InterfaceV2sImpl(AddedClientImpl client) {
        this.service = InterfaceV2sService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public AddedServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    /**
     * The interface defining all the services for AddedClientInterfaceV2s to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "AddedClientInterfaceV2s", host = "{endpoint}/versioning/added/api-version:{version}")
    public interface InterfaceV2sService {
        static InterfaceV2sService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.added.implementation.InterfaceV2sServiceImpl");
                return (InterfaceV2sService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/interface-v2/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2InInterface(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV2 body, RequestContext requestContext);
    }

    /**
     * The v2InInterface operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV2> v2InInterfaceWithResponse(ModelV2 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Added.InterfaceV2.v2InInterface", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.v2InInterface(this.client.getEndpoint(), this.client.getServiceVersion().getVersion(),
                    contentType, accept, body, updatedContext);
            });
    }
}
