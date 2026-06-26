package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in Parameters.
 */
public final class ParametersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ParametersService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ParametersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ParametersImpl(SpecialWordsClientImpl client) {
        this.service = ParametersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SpecialWordsClientParameters to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientParameters", host = "{endpoint}")
    public interface ParametersService {
        static ParametersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("specialwords.implementation.ParametersServiceImpl");
                return (ParametersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/and",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAnd(@HostParam("endpoint") String endpoint, @QueryParam("and") String and,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/as",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAs(@HostParam("endpoint") String endpoint, @QueryParam("as") String as,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/assert",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAssert(@HostParam("endpoint") String endpoint, @QueryParam("assert") String assertParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/async",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAsync(@HostParam("endpoint") String endpoint, @QueryParam("async") String async,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/await",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAwait(@HostParam("endpoint") String endpoint, @QueryParam("await") String await,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/break",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withBreak(@HostParam("endpoint") String endpoint, @QueryParam("break") String breakParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/class",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withClass(@HostParam("endpoint") String endpoint, @QueryParam("class") String classParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/constructor",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withConstructor(@HostParam("endpoint") String endpoint,
            @QueryParam("constructor") String constructor, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/continue",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withContinue(@HostParam("endpoint") String endpoint,
            @QueryParam("continue") String continueParameter, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/def",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDef(@HostParam("endpoint") String endpoint, @QueryParam("def") String def,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/del",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDel(@HostParam("endpoint") String endpoint, @QueryParam("del") String del,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/elif",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElif(@HostParam("endpoint") String endpoint, @QueryParam("elif") String elif,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/else",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElse(@HostParam("endpoint") String endpoint, @QueryParam("else") String elseParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/except",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExcept(@HostParam("endpoint") String endpoint, @QueryParam("except") String except,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/exec",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExec(@HostParam("endpoint") String endpoint, @QueryParam("exec") String exec,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/finally",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFinally(@HostParam("endpoint") String endpoint,
            @QueryParam("finally") String finallyParameter, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/for",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFor(@HostParam("endpoint") String endpoint, @QueryParam("for") String forParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/from",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFrom(@HostParam("endpoint") String endpoint, @QueryParam("from") String from,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/global",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withGlobal(@HostParam("endpoint") String endpoint, @QueryParam("global") String global,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/if",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIf(@HostParam("endpoint") String endpoint, @QueryParam("if") String ifParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/import",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withImport(@HostParam("endpoint") String endpoint, @QueryParam("import") String importParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/in",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIn(@HostParam("endpoint") String endpoint, @QueryParam("in") String in,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/is",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIs(@HostParam("endpoint") String endpoint, @QueryParam("is") String is,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/lambda",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withLambda(@HostParam("endpoint") String endpoint, @QueryParam("lambda") String lambda,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/not",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withNot(@HostParam("endpoint") String endpoint, @QueryParam("not") String not,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/or",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withOr(@HostParam("endpoint") String endpoint, @QueryParam("or") String or,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/pass",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPass(@HostParam("endpoint") String endpoint, @QueryParam("pass") String pass,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/raise",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withRaise(@HostParam("endpoint") String endpoint, @QueryParam("raise") String raise,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/return",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withReturn(@HostParam("endpoint") String endpoint, @QueryParam("return") String returnParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/try",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withTry(@HostParam("endpoint") String endpoint, @QueryParam("try") String tryParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/while",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWhile(@HostParam("endpoint") String endpoint, @QueryParam("while") String whileParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/with",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWith(@HostParam("endpoint") String endpoint, @QueryParam("with") String with,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/yield",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withYield(@HostParam("endpoint") String endpoint, @QueryParam("yield") String yield,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/cancellationToken",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withCancellationToken(@HostParam("endpoint") String endpoint,
            @QueryParam("cancellationToken") String cancellationToken, RequestContext requestContext);
    }

    /**
     * The withAnd operation.
     * 
     * @param and The and parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(String and, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAnd", requestContext,
            updatedContext -> {
                return service.withAnd(this.client.getEndpoint(), and, updatedContext);
            });
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(String as, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAs", requestContext,
            updatedContext -> {
                return service.withAs(this.client.getEndpoint(), as, updatedContext);
            });
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(String assertParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAssert", requestContext,
            updatedContext -> {
                return service.withAssert(this.client.getEndpoint(), assertParameter, updatedContext);
            });
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(String async, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAsync", requestContext,
            updatedContext -> {
                return service.withAsync(this.client.getEndpoint(), async, updatedContext);
            });
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(String await, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAwait", requestContext,
            updatedContext -> {
                return service.withAwait(this.client.getEndpoint(), await, updatedContext);
            });
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(String breakParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withBreak", requestContext,
            updatedContext -> {
                return service.withBreak(this.client.getEndpoint(), breakParameter, updatedContext);
            });
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(String classParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withClass", requestContext,
            updatedContext -> {
                return service.withClass(this.client.getEndpoint(), classParameter, updatedContext);
            });
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(String constructor, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withConstructor", requestContext,
            updatedContext -> {
                return service.withConstructor(this.client.getEndpoint(), constructor, updatedContext);
            });
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(String continueParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withContinue", requestContext,
            updatedContext -> {
                return service.withContinue(this.client.getEndpoint(), continueParameter, updatedContext);
            });
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(String def, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withDef", requestContext,
            updatedContext -> {
                return service.withDef(this.client.getEndpoint(), def, updatedContext);
            });
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(String del, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withDel", requestContext,
            updatedContext -> {
                return service.withDel(this.client.getEndpoint(), del, updatedContext);
            });
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(String elif, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withElif", requestContext,
            updatedContext -> {
                return service.withElif(this.client.getEndpoint(), elif, updatedContext);
            });
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(String elseParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withElse", requestContext,
            updatedContext -> {
                return service.withElse(this.client.getEndpoint(), elseParameter, updatedContext);
            });
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(String except, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withExcept", requestContext,
            updatedContext -> {
                return service.withExcept(this.client.getEndpoint(), except, updatedContext);
            });
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(String exec, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withExec", requestContext,
            updatedContext -> {
                return service.withExec(this.client.getEndpoint(), exec, updatedContext);
            });
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(String finallyParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFinally", requestContext,
            updatedContext -> {
                return service.withFinally(this.client.getEndpoint(), finallyParameter, updatedContext);
            });
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(String forParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFor", requestContext,
            updatedContext -> {
                return service.withFor(this.client.getEndpoint(), forParameter, updatedContext);
            });
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(String from, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFrom", requestContext,
            updatedContext -> {
                return service.withFrom(this.client.getEndpoint(), from, updatedContext);
            });
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(String global, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withGlobal", requestContext,
            updatedContext -> {
                return service.withGlobal(this.client.getEndpoint(), global, updatedContext);
            });
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(String ifParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIf", requestContext,
            updatedContext -> {
                return service.withIf(this.client.getEndpoint(), ifParameter, updatedContext);
            });
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(String importParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withImport", requestContext,
            updatedContext -> {
                return service.withImport(this.client.getEndpoint(), importParameter, updatedContext);
            });
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(String in, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIn", requestContext,
            updatedContext -> {
                return service.withIn(this.client.getEndpoint(), in, updatedContext);
            });
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(String is, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIs", requestContext,
            updatedContext -> {
                return service.withIs(this.client.getEndpoint(), is, updatedContext);
            });
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(String lambda, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withLambda", requestContext,
            updatedContext -> {
                return service.withLambda(this.client.getEndpoint(), lambda, updatedContext);
            });
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(String not, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withNot", requestContext,
            updatedContext -> {
                return service.withNot(this.client.getEndpoint(), not, updatedContext);
            });
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(String or, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withOr", requestContext,
            updatedContext -> {
                return service.withOr(this.client.getEndpoint(), or, updatedContext);
            });
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(String pass, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withPass", requestContext,
            updatedContext -> {
                return service.withPass(this.client.getEndpoint(), pass, updatedContext);
            });
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(String raise, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withRaise", requestContext,
            updatedContext -> {
                return service.withRaise(this.client.getEndpoint(), raise, updatedContext);
            });
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(String returnParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withReturn", requestContext,
            updatedContext -> {
                return service.withReturn(this.client.getEndpoint(), returnParameter, updatedContext);
            });
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(String tryParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withTry", requestContext,
            updatedContext -> {
                return service.withTry(this.client.getEndpoint(), tryParameter, updatedContext);
            });
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(String whileParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withWhile", requestContext,
            updatedContext -> {
                return service.withWhile(this.client.getEndpoint(), whileParameter, updatedContext);
            });
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(String with, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withWith", requestContext,
            updatedContext -> {
                return service.withWith(this.client.getEndpoint(), with, updatedContext);
            });
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(String yield, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withYield", requestContext,
            updatedContext -> {
                return service.withYield(this.client.getEndpoint(), yield, updatedContext);
            });
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withCancellationTokenWithResponse(String cancellationToken, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withCancellationToken",
            requestContext, updatedContext -> {
                return service.withCancellationToken(this.client.getEndpoint(), cancellationToken, updatedContext);
            });
    }
}
