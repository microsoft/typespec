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
import io.clientcore.core.instrumentation.Instrumentation;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of OperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    OperationsImpl(SpecialWordsClientImpl client) {
        this.service = OperationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> andWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.and", requestContext,
            updatedContext -> {
                return service.and(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The as operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.as", requestContext,
            updatedContext -> {
                return service.as(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The assertMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> assertMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.assert", requestContext,
            updatedContext -> {
                return service.assertMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The async operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asyncWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.async", requestContext,
            updatedContext -> {
                return service.async(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The await operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> awaitWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.await", requestContext,
            updatedContext -> {
                return service.await(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The breakMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> breakMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.break", requestContext,
            updatedContext -> {
                return service.breakMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The classMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> classMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.class", requestContext,
            updatedContext -> {
                return service.classMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The constructor operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> constructorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.constructor", requestContext,
            updatedContext -> {
                return service.constructor(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The continueMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> continueMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.continue", requestContext,
            updatedContext -> {
                return service.continueMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The def operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.def", requestContext,
            updatedContext -> {
                return service.def(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The del operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> delWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.del", requestContext,
            updatedContext -> {
                return service.del(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The elif operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elifWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.elif", requestContext,
            updatedContext -> {
                return service.elif(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The elseMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elseMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.else", requestContext,
            updatedContext -> {
                return service.elseMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The except operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> exceptWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.except", requestContext,
            updatedContext -> {
                return service.except(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The exec operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> execWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.exec", requestContext,
            updatedContext -> {
                return service.exec(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The finallyMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> finallyMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.finally", requestContext,
            updatedContext -> {
                return service.finallyMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The forMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> forMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.for", requestContext,
            updatedContext -> {
                return service.forMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The from operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fromWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.from", requestContext,
            updatedContext -> {
                return service.from(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The global operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> globalWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.global", requestContext,
            updatedContext -> {
                return service.global(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The ifMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> ifMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.if", requestContext,
            updatedContext -> {
                return service.ifMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The importMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> importMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.import", requestContext,
            updatedContext -> {
                return service.importMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The in operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> inWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.in", requestContext,
            updatedContext -> {
                return service.in(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The is operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> isWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.is", requestContext,
            updatedContext -> {
                return service.is(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The lambda operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> lambdaWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.lambda", requestContext,
            updatedContext -> {
                return service.lambda(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The not operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> notWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.not", requestContext,
            updatedContext -> {
                return service.not(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The or operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> orWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.or", requestContext,
            updatedContext -> {
                return service.or(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The pass operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> passWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.pass", requestContext,
            updatedContext -> {
                return service.pass(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The raise operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> raiseWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.raise", requestContext,
            updatedContext -> {
                return service.raise(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The returnMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> returnMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.return", requestContext,
            updatedContext -> {
                return service.returnMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The tryMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> tryMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.try", requestContext,
            updatedContext -> {
                return service.tryMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The whileMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> whileMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.while", requestContext,
            updatedContext -> {
                return service.whileMethod(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The with operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.with", requestContext,
            updatedContext -> {
                return service.with(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The yield operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> yieldWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.yield", requestContext,
            updatedContext -> {
                return service.yield(this.client.getEndpoint(), updatedContext);
            });
    }
}
