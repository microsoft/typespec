package specialwords.implementation;

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
import specialwords.extensiblestrings.ExtensibleString;

/**
 * An instance of this class provides access to all the operations defined in ExtensibleStrings.
 */
public final class ExtensibleStringsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExtensibleStringsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtensibleStringsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExtensibleStringsImpl(SpecialWordsClientImpl client) {
        this.service = ExtensibleStringsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SpecialWordsClientExtensibleStrings to be used by the proxy service
     * to perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientExtensibleStrings", host = "{endpoint}")
    public interface ExtensibleStringsService {
        static ExtensibleStringsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("specialwords.implementation.ExtensibleStringsServiceImpl");
                return (ExtensibleStringsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/special-words/extensible-strings/string",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ExtensibleString> putExtensibleStringValue(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ExtensibleString body, RequestContext requestContext);
    }

    /**
     * The putExtensibleStringValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return verify enum member names that are special words using extensible enum (union) along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ExtensibleString> putExtensibleStringValueWithResponse(ExtensibleString body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ExtensibleStrings.putExtensibleStringValue",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.putExtensibleStringValue(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }
}
