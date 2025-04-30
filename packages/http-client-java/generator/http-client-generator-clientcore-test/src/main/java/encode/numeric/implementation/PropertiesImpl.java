package encode.numeric.implementation;

import encode.numeric.property.SafeintAsStringProperty;
import encode.numeric.property.Uint32AsStringProperty;
import encode.numeric.property.Uint8AsStringProperty;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final NumericClientImpl client;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(NumericClientImpl client) {
        this.service = RestProxy.create(PropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for NumericClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "NumericClientPropert", host = "{endpoint}")
    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.numeric.implementation.PropertiesServiceImpl");
                return (PropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/safeint",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SafeintAsStringProperty> safeintAsString(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") SafeintAsStringProperty value, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/uint32",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Uint32AsStringProperty> uint32AsStringOptional(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Uint32AsStringProperty value, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/uint8",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Uint8AsStringProperty> uint8AsString(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Uint8AsStringProperty value, RequestContext requestContext);
    }

    /**
     * The safeintAsString operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SafeintAsStringProperty> safeintAsStringWithResponse(SafeintAsStringProperty value,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.safeintAsString(this.client.getEndpoint(), contentType, accept, value, requestContext);
    }

    /**
     * The safeintAsString operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public SafeintAsStringProperty safeintAsString(SafeintAsStringProperty value) {
        return safeintAsStringWithResponse(value, RequestContext.none()).getValue();
    }

    /**
     * The uint32AsStringOptional operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Uint32AsStringProperty> uint32AsStringOptionalWithResponse(Uint32AsStringProperty value,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.uint32AsStringOptional(this.client.getEndpoint(), contentType, accept, value, requestContext);
    }

    /**
     * The uint32AsStringOptional operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Uint32AsStringProperty uint32AsStringOptional(Uint32AsStringProperty value) {
        return uint32AsStringOptionalWithResponse(value, RequestContext.none()).getValue();
    }

    /**
     * The uint8AsString operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Uint8AsStringProperty> uint8AsStringWithResponse(Uint8AsStringProperty value,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.uint8AsString(this.client.getEndpoint(), contentType, accept, value, requestContext);
    }

    /**
     * The uint8AsString operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Uint8AsStringProperty uint8AsString(Uint8AsStringProperty value) {
        return uint8AsStringWithResponse(value, RequestContext.none()).getValue();
    }
}
