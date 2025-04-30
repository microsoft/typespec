package type.scalar.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
import java.lang.reflect.InvocationTargetException;
import java.math.BigDecimal;

/**
 * An instance of this class provides access to all the operations defined in Decimal128Types.
 */
public final class Decimal128TypesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final Decimal128TypesService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * Initializes an instance of Decimal128TypesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    Decimal128TypesImpl(ScalarClientImpl client) {
        this.service = RestProxy.create(Decimal128TypesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ScalarClientDecimal128Types to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "ScalarClientDecimal1", host = "{endpoint}")
    public interface Decimal128TypesService {
        static Decimal128TypesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.scalar.implementation.Decimal128TypesServiceImpl");
                return (Decimal128TypesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal128/response_body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BigDecimal> responseBody(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/scalar/decimal128/resquest_body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requestBody(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BigDecimal body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal128/request_parameter",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requestParameter(@HostParam("endpoint") String endpoint, @QueryParam("value") BigDecimal value,
            RequestContext requestContext);
    }

    /**
     * The responseBody operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a 128-bit decimal number.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BigDecimal> responseBodyWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.responseBody(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * The responseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a 128-bit decimal number.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BigDecimal responseBody() {
        return responseBodyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The requestBody operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requestBodyWithResponse(BigDecimal body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.requestBody(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The requestBody operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requestBody(BigDecimal body) {
        requestBodyWithResponse(body, RequestContext.none());
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requestParameterWithResponse(BigDecimal value, RequestContext requestContext) {
        return service.requestParameter(this.client.getEndpoint(), value, requestContext);
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requestParameter(BigDecimal value) {
        requestParameterWithResponse(value, RequestContext.none());
    }
}
