package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
     * Initializes an instance of ParametersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ParametersImpl(SpecialWordsClientImpl client) {
        this.service = RestProxy.create(ParametersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpecialWordsClientParameters to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientPa", host = "{endpoint}")
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(String and, RequestContext requestContext) {
        return service.withAnd(this.client.getEndpoint(), and, requestContext);
    }

    /**
     * The withAnd operation.
     * 
     * @param and The and parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAnd(String and) {
        withAndWithResponse(and, RequestContext.none());
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(String as, RequestContext requestContext) {
        return service.withAs(this.client.getEndpoint(), as, requestContext);
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAs(String as) {
        withAsWithResponse(as, RequestContext.none());
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(String assertParameter, RequestContext requestContext) {
        return service.withAssert(this.client.getEndpoint(), assertParameter, requestContext);
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAssert(String assertParameter) {
        withAssertWithResponse(assertParameter, RequestContext.none());
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(String async, RequestContext requestContext) {
        return service.withAsync(this.client.getEndpoint(), async, requestContext);
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAsync(String async) {
        withAsyncWithResponse(async, RequestContext.none());
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(String await, RequestContext requestContext) {
        return service.withAwait(this.client.getEndpoint(), await, requestContext);
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAwait(String await) {
        withAwaitWithResponse(await, RequestContext.none());
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(String breakParameter, RequestContext requestContext) {
        return service.withBreak(this.client.getEndpoint(), breakParameter, requestContext);
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withBreak(String breakParameter) {
        withBreakWithResponse(breakParameter, RequestContext.none());
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(String classParameter, RequestContext requestContext) {
        return service.withClass(this.client.getEndpoint(), classParameter, requestContext);
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withClass(String classParameter) {
        withClassWithResponse(classParameter, RequestContext.none());
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(String constructor, RequestContext requestContext) {
        return service.withConstructor(this.client.getEndpoint(), constructor, requestContext);
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withConstructor(String constructor) {
        withConstructorWithResponse(constructor, RequestContext.none());
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(String continueParameter, RequestContext requestContext) {
        return service.withContinue(this.client.getEndpoint(), continueParameter, requestContext);
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withContinue(String continueParameter) {
        withContinueWithResponse(continueParameter, RequestContext.none());
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(String def, RequestContext requestContext) {
        return service.withDef(this.client.getEndpoint(), def, requestContext);
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withDef(String def) {
        withDefWithResponse(def, RequestContext.none());
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(String del, RequestContext requestContext) {
        return service.withDel(this.client.getEndpoint(), del, requestContext);
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withDel(String del) {
        withDelWithResponse(del, RequestContext.none());
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(String elif, RequestContext requestContext) {
        return service.withElif(this.client.getEndpoint(), elif, requestContext);
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withElif(String elif) {
        withElifWithResponse(elif, RequestContext.none());
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(String elseParameter, RequestContext requestContext) {
        return service.withElse(this.client.getEndpoint(), elseParameter, requestContext);
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withElse(String elseParameter) {
        withElseWithResponse(elseParameter, RequestContext.none());
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(String except, RequestContext requestContext) {
        return service.withExcept(this.client.getEndpoint(), except, requestContext);
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withExcept(String except) {
        withExceptWithResponse(except, RequestContext.none());
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(String exec, RequestContext requestContext) {
        return service.withExec(this.client.getEndpoint(), exec, requestContext);
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withExec(String exec) {
        withExecWithResponse(exec, RequestContext.none());
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(String finallyParameter, RequestContext requestContext) {
        return service.withFinally(this.client.getEndpoint(), finallyParameter, requestContext);
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFinally(String finallyParameter) {
        withFinallyWithResponse(finallyParameter, RequestContext.none());
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(String forParameter, RequestContext requestContext) {
        return service.withFor(this.client.getEndpoint(), forParameter, requestContext);
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFor(String forParameter) {
        withForWithResponse(forParameter, RequestContext.none());
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(String from, RequestContext requestContext) {
        return service.withFrom(this.client.getEndpoint(), from, requestContext);
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFrom(String from) {
        withFromWithResponse(from, RequestContext.none());
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(String global, RequestContext requestContext) {
        return service.withGlobal(this.client.getEndpoint(), global, requestContext);
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withGlobal(String global) {
        withGlobalWithResponse(global, RequestContext.none());
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(String ifParameter, RequestContext requestContext) {
        return service.withIf(this.client.getEndpoint(), ifParameter, requestContext);
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIf(String ifParameter) {
        withIfWithResponse(ifParameter, RequestContext.none());
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(String importParameter, RequestContext requestContext) {
        return service.withImport(this.client.getEndpoint(), importParameter, requestContext);
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withImport(String importParameter) {
        withImportWithResponse(importParameter, RequestContext.none());
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(String in, RequestContext requestContext) {
        return service.withIn(this.client.getEndpoint(), in, requestContext);
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIn(String in) {
        withInWithResponse(in, RequestContext.none());
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(String is, RequestContext requestContext) {
        return service.withIs(this.client.getEndpoint(), is, requestContext);
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIs(String is) {
        withIsWithResponse(is, RequestContext.none());
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(String lambda, RequestContext requestContext) {
        return service.withLambda(this.client.getEndpoint(), lambda, requestContext);
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withLambda(String lambda) {
        withLambdaWithResponse(lambda, RequestContext.none());
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(String not, RequestContext requestContext) {
        return service.withNot(this.client.getEndpoint(), not, requestContext);
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withNot(String not) {
        withNotWithResponse(not, RequestContext.none());
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(String or, RequestContext requestContext) {
        return service.withOr(this.client.getEndpoint(), or, requestContext);
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withOr(String or) {
        withOrWithResponse(or, RequestContext.none());
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(String pass, RequestContext requestContext) {
        return service.withPass(this.client.getEndpoint(), pass, requestContext);
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPass(String pass) {
        withPassWithResponse(pass, RequestContext.none());
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(String raise, RequestContext requestContext) {
        return service.withRaise(this.client.getEndpoint(), raise, requestContext);
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withRaise(String raise) {
        withRaiseWithResponse(raise, RequestContext.none());
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(String returnParameter, RequestContext requestContext) {
        return service.withReturn(this.client.getEndpoint(), returnParameter, requestContext);
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withReturn(String returnParameter) {
        withReturnWithResponse(returnParameter, RequestContext.none());
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(String tryParameter, RequestContext requestContext) {
        return service.withTry(this.client.getEndpoint(), tryParameter, requestContext);
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withTry(String tryParameter) {
        withTryWithResponse(tryParameter, RequestContext.none());
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(String whileParameter, RequestContext requestContext) {
        return service.withWhile(this.client.getEndpoint(), whileParameter, requestContext);
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withWhile(String whileParameter) {
        withWhileWithResponse(whileParameter, RequestContext.none());
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(String with, RequestContext requestContext) {
        return service.withWith(this.client.getEndpoint(), with, requestContext);
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withWith(String with) {
        withWithWithResponse(with, RequestContext.none());
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(String yield, RequestContext requestContext) {
        return service.withYield(this.client.getEndpoint(), yield, requestContext);
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withYield(String yield) {
        withYieldWithResponse(yield, RequestContext.none());
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withCancellationTokenWithResponse(String cancellationToken, RequestContext requestContext) {
        return service.withCancellationToken(this.client.getEndpoint(), cancellationToken, requestContext);
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withCancellationToken(String cancellationToken) {
        withCancellationTokenWithResponse(cancellationToken, RequestContext.none());
    }
}
