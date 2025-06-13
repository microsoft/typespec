package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
 * An instance of this class provides access to all the operations defined in Operations.
 */
public final class OperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final OperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * Initializes an instance of OperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    OperationsImpl(SpecialWordsClientImpl client) {
        this.service = OperationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpecialWordsClientOperations to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientOperations", host = "{endpoint}")
    public interface OperationsService {
        static OperationsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("specialwords.implementation.OperationsServiceImpl");
                return (OperationsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/and",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> and(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/as",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> as(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/assert",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> assertMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/async",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> async(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/await",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> await(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/break",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> breakMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/class",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> classMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/constructor",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> constructor(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/continue",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> continueMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/def",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> def(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/del",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> del(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/elif",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> elif(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/else",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> elseMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/except",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> except(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/exec",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> exec(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/finally",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> finallyMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/for",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> forMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/from",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> from(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/global",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> global(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/if",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> ifMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/import",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> importMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/in",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> in(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/is",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> is(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/lambda",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> lambda(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/not",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> not(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/or",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> or(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/pass",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> pass(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/raise",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> raise(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/return",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> returnMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/try",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> tryMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/while",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> whileMethod(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/with",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> with(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/yield",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> yield(@HostParam("endpoint") String endpoint, RequestContext requestContext);
    }

    /**
     * The and operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> andWithResponse(RequestContext requestContext) {
        return service.and(this.client.getEndpoint(), requestContext);
    }

    /**
     * The as operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asWithResponse(RequestContext requestContext) {
        return service.as(this.client.getEndpoint(), requestContext);
    }

    /**
     * The assertMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> assertMethodWithResponse(RequestContext requestContext) {
        return service.assertMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The async operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asyncWithResponse(RequestContext requestContext) {
        return service.async(this.client.getEndpoint(), requestContext);
    }

    /**
     * The await operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> awaitWithResponse(RequestContext requestContext) {
        return service.await(this.client.getEndpoint(), requestContext);
    }

    /**
     * The breakMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> breakMethodWithResponse(RequestContext requestContext) {
        return service.breakMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The classMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> classMethodWithResponse(RequestContext requestContext) {
        return service.classMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The constructor operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> constructorWithResponse(RequestContext requestContext) {
        return service.constructor(this.client.getEndpoint(), requestContext);
    }

    /**
     * The continueMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> continueMethodWithResponse(RequestContext requestContext) {
        return service.continueMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The def operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defWithResponse(RequestContext requestContext) {
        return service.def(this.client.getEndpoint(), requestContext);
    }

    /**
     * The del operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> delWithResponse(RequestContext requestContext) {
        return service.del(this.client.getEndpoint(), requestContext);
    }

    /**
     * The elif operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elifWithResponse(RequestContext requestContext) {
        return service.elif(this.client.getEndpoint(), requestContext);
    }

    /**
     * The elseMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elseMethodWithResponse(RequestContext requestContext) {
        return service.elseMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The except operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> exceptWithResponse(RequestContext requestContext) {
        return service.except(this.client.getEndpoint(), requestContext);
    }

    /**
     * The exec operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> execWithResponse(RequestContext requestContext) {
        return service.exec(this.client.getEndpoint(), requestContext);
    }

    /**
     * The finallyMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> finallyMethodWithResponse(RequestContext requestContext) {
        return service.finallyMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The forMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> forMethodWithResponse(RequestContext requestContext) {
        return service.forMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The from operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fromWithResponse(RequestContext requestContext) {
        return service.from(this.client.getEndpoint(), requestContext);
    }

    /**
     * The global operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> globalWithResponse(RequestContext requestContext) {
        return service.global(this.client.getEndpoint(), requestContext);
    }

    /**
     * The ifMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> ifMethodWithResponse(RequestContext requestContext) {
        return service.ifMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The importMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> importMethodWithResponse(RequestContext requestContext) {
        return service.importMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The in operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> inWithResponse(RequestContext requestContext) {
        return service.in(this.client.getEndpoint(), requestContext);
    }

    /**
     * The is operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> isWithResponse(RequestContext requestContext) {
        return service.is(this.client.getEndpoint(), requestContext);
    }

    /**
     * The lambda operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> lambdaWithResponse(RequestContext requestContext) {
        return service.lambda(this.client.getEndpoint(), requestContext);
    }

    /**
     * The not operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> notWithResponse(RequestContext requestContext) {
        return service.not(this.client.getEndpoint(), requestContext);
    }

    /**
     * The or operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> orWithResponse(RequestContext requestContext) {
        return service.or(this.client.getEndpoint(), requestContext);
    }

    /**
     * The pass operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> passWithResponse(RequestContext requestContext) {
        return service.pass(this.client.getEndpoint(), requestContext);
    }

    /**
     * The raise operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> raiseWithResponse(RequestContext requestContext) {
        return service.raise(this.client.getEndpoint(), requestContext);
    }

    /**
     * The returnMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> returnMethodWithResponse(RequestContext requestContext) {
        return service.returnMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The tryMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> tryMethodWithResponse(RequestContext requestContext) {
        return service.tryMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The whileMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> whileMethodWithResponse(RequestContext requestContext) {
        return service.whileMethod(this.client.getEndpoint(), requestContext);
    }

    /**
     * The with operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithResponse(RequestContext requestContext) {
        return service.with(this.client.getEndpoint(), requestContext);
    }

    /**
     * The yield operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> yieldWithResponse(RequestContext requestContext) {
        return service.yield(this.client.getEndpoint(), requestContext);
    }
}
