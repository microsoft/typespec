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
import java.lang.reflect.InvocationTargetException;
import payload.xml.ModelWithOptionalField;

/**
 * An instance of this class provides access to all the operations defined in ModelWithOptionalFieldValues.
 */
public final class ModelWithOptionalFieldValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithOptionalFieldValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * Initializes an instance of ModelWithOptionalFieldValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithOptionalFieldValuesImpl(XmlClientImpl client) {
        this.service = ModelWithOptionalFieldValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for XmlClientModelWithOptionalFieldValues to be used by the proxy service
     * to perform REST calls.
     */
    @ServiceInterface(name = "XmlClientModelWithOptionalFieldValues", host = "{endpoint}")
    public interface ModelWithOptionalFieldValuesService {
        static ModelWithOptionalFieldValuesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.xml.implementation.ModelWithOptionalFieldValuesServiceImpl");
                return (ModelWithOptionalFieldValuesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/xml/modelWithOptionalField",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelWithOptionalField> get(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/payload/xml/modelWithOptionalField",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> put(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("application/xml") ModelWithOptionalField input, RequestContext requestContext);
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return contains an optional field.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithOptionalField> getWithResponse(RequestContext requestContext) {
        final String accept = "application/xml";
        return service.get(this.client.getEndpoint(), accept, requestContext);
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
    public Response<Void> putWithResponse(ModelWithOptionalField input, RequestContext requestContext) {
        final String contentType = "application/xml";
        return service.put(this.client.getEndpoint(), contentType, input, requestContext);
    }
}
