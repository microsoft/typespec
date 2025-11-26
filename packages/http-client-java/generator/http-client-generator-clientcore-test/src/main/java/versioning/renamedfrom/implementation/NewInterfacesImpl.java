package versioning.renamedfrom.implementation;

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
import versioning.renamedfrom.NewModel;
import versioning.renamedfrom.RenamedFromServiceVersion;

/**
 * An instance of this class provides access to all the operations defined in NewInterfaces.
 */
public final class NewInterfacesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NewInterfacesService service;

    /**
     * The service client containing this operation class.
     */
    private final RenamedFromClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NewInterfacesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NewInterfacesImpl(RenamedFromClientImpl client) {
        this.service = NewInterfacesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RenamedFromServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    /**
     * The interface defining all the services for RenamedFromClientNewInterfaces to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(
        name = "RenamedFromClientNewInterfaces",
        host = "{endpoint}/versioning/renamed-from/api-version:{version}")
    public interface NewInterfacesService {
        static NewInterfacesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.renamedfrom.implementation.NewInterfacesServiceImpl");
                return (NewInterfacesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/interface/test", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewModel> newOpInNewInterface(@HostParam("endpoint") String endpoint,
            @HostParam("version") String version, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") NewModel body,
            RequestContext requestContext);
    }

    /**
     * The newOpInNewInterface operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewModel> newOpInNewInterfaceWithResponse(NewModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.RenamedFrom.NewInterface.newOpInNewInterface",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.newOpInNewInterface(this.client.getEndpoint(),
                    this.client.getServiceVersion().getVersion(), contentType, accept, body, updatedContext);
            });
    }
}
