package payload.xml.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
import payload.xml.SimpleModel;
import payload.xml.XmlErrorBody;

/**
 * An instance of this class provides access to all the operations defined in XmlErrorValues.
 */
public final class XmlErrorValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final XmlErrorValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of XmlErrorValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    XmlErrorValuesImpl(XmlClientImpl client) {
        this.service = XmlErrorValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for XmlClientXmlErrorValues to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "XmlClientXmlErrorValues", host = "{endpoint}")
    public interface XmlErrorValuesService {
        static XmlErrorValuesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.xml.implementation.XmlErrorValuesServiceImpl");
                return (XmlErrorValuesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/payload/xml/error", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(statusCode = { 400 }, exceptionBodyClass = XmlErrorBody.class)
        @UnexpectedResponseExceptionDetail
        Response<SimpleModel> get(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return contains fields of primitive types along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SimpleModel> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.XmlErrorValue.get", requestContext,
            updatedContext -> {
                final String accept = "application/xml";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
