package payload.xml.implementation;

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
import payload.xml.ModelWithNamespace;

/**
 * An instance of this class provides access to all the operations defined in ModelWithNamespaceValues.
 */
public final class ModelWithNamespaceValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithNamespaceValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithNamespaceValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithNamespaceValuesImpl(XmlClientImpl client) {
        this.service = ModelWithNamespaceValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for XmlClientModelWithNamespaceValues to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "XmlClientModelWithNamespaceValues", host = "{endpoint}")
    public interface ModelWithNamespaceValuesService {
        static ModelWithNamespaceValuesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.xml.implementation.ModelWithNamespaceValuesServiceImpl");
                return (ModelWithNamespaceValuesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/xml/modelWithNamespace",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelWithNamespace> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/payload/xml/modelWithNamespace",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> put(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("application/xml") ModelWithNamespace input, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return §6.1, §7.1 — Contains fields with XML namespace on the model along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithNamespace> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithNamespaceValue.get", requestContext,
            updatedContext -> {
                final String accept = "application/xml";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(ModelWithNamespace input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithNamespaceValue.put", requestContext,
            updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }
}
