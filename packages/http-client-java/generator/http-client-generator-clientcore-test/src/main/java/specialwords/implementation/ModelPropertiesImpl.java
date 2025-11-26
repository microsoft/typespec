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
import specialwords.modelproperties.SameAsModel;

/**
 * An instance of this class provides access to all the operations defined in ModelProperties.
 */
public final class ModelPropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelPropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelPropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelPropertiesImpl(SpecialWordsClientImpl client) {
        this.service = ModelPropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SpecialWordsClientModelProperties to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientModelProperties", host = "{endpoint}")
    public interface ModelPropertiesService {
        static ModelPropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("specialwords.implementation.ModelPropertiesServiceImpl");
                return (ModelPropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/model-properties/same-as-model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sameAsModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") SameAsModel body,
            RequestContext requestContext);
    }

    /**
     * The sameAsModel operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sameAsModelWithResponse(SameAsModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ModelProperties.sameAsModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.sameAsModel(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
