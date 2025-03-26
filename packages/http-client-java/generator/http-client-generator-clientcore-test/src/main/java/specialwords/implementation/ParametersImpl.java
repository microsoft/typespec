package specialwords.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

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
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/and",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAndSync(@HostParam("endpoint") String endpoint, @QueryParam("and") String and,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/as",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAsSync(@HostParam("endpoint") String endpoint, @QueryParam("as") String as,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/assert",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAssertSync(@HostParam("endpoint") String endpoint,
            @QueryParam("assert") String assertParameter, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/async",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAsyncSync(@HostParam("endpoint") String endpoint, @QueryParam("async") String async,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/await",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAwaitSync(@HostParam("endpoint") String endpoint, @QueryParam("await") String await,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/break",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withBreakSync(@HostParam("endpoint") String endpoint, @QueryParam("break") String breakParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/class",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withClassSync(@HostParam("endpoint") String endpoint, @QueryParam("class") String classParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/constructor",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withConstructorSync(@HostParam("endpoint") String endpoint,
            @QueryParam("constructor") String constructor, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/continue",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withContinueSync(@HostParam("endpoint") String endpoint,
            @QueryParam("continue") String continueParameter, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/def",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDefSync(@HostParam("endpoint") String endpoint, @QueryParam("def") String def,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/del",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDelSync(@HostParam("endpoint") String endpoint, @QueryParam("del") String del,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/elif",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElifSync(@HostParam("endpoint") String endpoint, @QueryParam("elif") String elif,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/else",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElseSync(@HostParam("endpoint") String endpoint, @QueryParam("else") String elseParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/except",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExceptSync(@HostParam("endpoint") String endpoint, @QueryParam("except") String except,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/exec",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExecSync(@HostParam("endpoint") String endpoint, @QueryParam("exec") String exec,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/finally",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFinallySync(@HostParam("endpoint") String endpoint,
            @QueryParam("finally") String finallyParameter, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/for",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withForSync(@HostParam("endpoint") String endpoint, @QueryParam("for") String forParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/from",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFromSync(@HostParam("endpoint") String endpoint, @QueryParam("from") String from,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/global",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withGlobalSync(@HostParam("endpoint") String endpoint, @QueryParam("global") String global,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/if",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIfSync(@HostParam("endpoint") String endpoint, @QueryParam("if") String ifParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/import",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withImportSync(@HostParam("endpoint") String endpoint,
            @QueryParam("import") String importParameter, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/in",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withInSync(@HostParam("endpoint") String endpoint, @QueryParam("in") String in,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/is",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIsSync(@HostParam("endpoint") String endpoint, @QueryParam("is") String is,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/lambda",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withLambdaSync(@HostParam("endpoint") String endpoint, @QueryParam("lambda") String lambda,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/not",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withNotSync(@HostParam("endpoint") String endpoint, @QueryParam("not") String not,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/or",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withOrSync(@HostParam("endpoint") String endpoint, @QueryParam("or") String or,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/pass",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPassSync(@HostParam("endpoint") String endpoint, @QueryParam("pass") String pass,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/raise",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withRaiseSync(@HostParam("endpoint") String endpoint, @QueryParam("raise") String raise,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/return",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withReturnSync(@HostParam("endpoint") String endpoint,
            @QueryParam("return") String returnParameter, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/try",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withTrySync(@HostParam("endpoint") String endpoint, @QueryParam("try") String tryParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/while",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWhileSync(@HostParam("endpoint") String endpoint, @QueryParam("while") String whileParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/with",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWithSync(@HostParam("endpoint") String endpoint, @QueryParam("with") String with,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/yield",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withYieldSync(@HostParam("endpoint") String endpoint, @QueryParam("yield") String yield,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/parameters/cancellationToken",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withCancellationTokenSync(@HostParam("endpoint") String endpoint,
            @QueryParam("cancellationToken") String cancellationToken, RequestOptions requestOptions);
    }

    /**
     * The withAnd operation.
     * 
     * @param and The and parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withAndWithResponse(String and, RequestOptions requestOptions) {
        return service.withAndSync(this.client.getEndpoint(), and, requestOptions);
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withAsWithResponse(String as, RequestOptions requestOptions) {
        return service.withAsSync(this.client.getEndpoint(), as, requestOptions);
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withAssertWithResponse(String assertParameter, RequestOptions requestOptions) {
        return service.withAssertSync(this.client.getEndpoint(), assertParameter, requestOptions);
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withAsyncWithResponse(String async, RequestOptions requestOptions) {
        return service.withAsyncSync(this.client.getEndpoint(), async, requestOptions);
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withAwaitWithResponse(String await, RequestOptions requestOptions) {
        return service.withAwaitSync(this.client.getEndpoint(), await, requestOptions);
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withBreakWithResponse(String breakParameter, RequestOptions requestOptions) {
        return service.withBreakSync(this.client.getEndpoint(), breakParameter, requestOptions);
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withClassWithResponse(String classParameter, RequestOptions requestOptions) {
        return service.withClassSync(this.client.getEndpoint(), classParameter, requestOptions);
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withConstructorWithResponse(String constructor, RequestOptions requestOptions) {
        return service.withConstructorSync(this.client.getEndpoint(), constructor, requestOptions);
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withContinueWithResponse(String continueParameter, RequestOptions requestOptions) {
        return service.withContinueSync(this.client.getEndpoint(), continueParameter, requestOptions);
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withDefWithResponse(String def, RequestOptions requestOptions) {
        return service.withDefSync(this.client.getEndpoint(), def, requestOptions);
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withDelWithResponse(String del, RequestOptions requestOptions) {
        return service.withDelSync(this.client.getEndpoint(), del, requestOptions);
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withElifWithResponse(String elif, RequestOptions requestOptions) {
        return service.withElifSync(this.client.getEndpoint(), elif, requestOptions);
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withElseWithResponse(String elseParameter, RequestOptions requestOptions) {
        return service.withElseSync(this.client.getEndpoint(), elseParameter, requestOptions);
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withExceptWithResponse(String except, RequestOptions requestOptions) {
        return service.withExceptSync(this.client.getEndpoint(), except, requestOptions);
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withExecWithResponse(String exec, RequestOptions requestOptions) {
        return service.withExecSync(this.client.getEndpoint(), exec, requestOptions);
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withFinallyWithResponse(String finallyParameter, RequestOptions requestOptions) {
        return service.withFinallySync(this.client.getEndpoint(), finallyParameter, requestOptions);
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withForWithResponse(String forParameter, RequestOptions requestOptions) {
        return service.withForSync(this.client.getEndpoint(), forParameter, requestOptions);
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withFromWithResponse(String from, RequestOptions requestOptions) {
        return service.withFromSync(this.client.getEndpoint(), from, requestOptions);
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withGlobalWithResponse(String global, RequestOptions requestOptions) {
        return service.withGlobalSync(this.client.getEndpoint(), global, requestOptions);
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withIfWithResponse(String ifParameter, RequestOptions requestOptions) {
        return service.withIfSync(this.client.getEndpoint(), ifParameter, requestOptions);
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withImportWithResponse(String importParameter, RequestOptions requestOptions) {
        return service.withImportSync(this.client.getEndpoint(), importParameter, requestOptions);
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withInWithResponse(String in, RequestOptions requestOptions) {
        return service.withInSync(this.client.getEndpoint(), in, requestOptions);
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withIsWithResponse(String is, RequestOptions requestOptions) {
        return service.withIsSync(this.client.getEndpoint(), is, requestOptions);
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withLambdaWithResponse(String lambda, RequestOptions requestOptions) {
        return service.withLambdaSync(this.client.getEndpoint(), lambda, requestOptions);
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withNotWithResponse(String not, RequestOptions requestOptions) {
        return service.withNotSync(this.client.getEndpoint(), not, requestOptions);
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withOrWithResponse(String or, RequestOptions requestOptions) {
        return service.withOrSync(this.client.getEndpoint(), or, requestOptions);
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withPassWithResponse(String pass, RequestOptions requestOptions) {
        return service.withPassSync(this.client.getEndpoint(), pass, requestOptions);
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withRaiseWithResponse(String raise, RequestOptions requestOptions) {
        return service.withRaiseSync(this.client.getEndpoint(), raise, requestOptions);
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withReturnWithResponse(String returnParameter, RequestOptions requestOptions) {
        return service.withReturnSync(this.client.getEndpoint(), returnParameter, requestOptions);
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withTryWithResponse(String tryParameter, RequestOptions requestOptions) {
        return service.withTrySync(this.client.getEndpoint(), tryParameter, requestOptions);
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withWhileWithResponse(String whileParameter, RequestOptions requestOptions) {
        return service.withWhileSync(this.client.getEndpoint(), whileParameter, requestOptions);
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withWithWithResponse(String with, RequestOptions requestOptions) {
        return service.withWithSync(this.client.getEndpoint(), with, requestOptions);
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withYieldWithResponse(String yield, RequestOptions requestOptions) {
        return service.withYieldSync(this.client.getEndpoint(), yield, requestOptions);
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withCancellationTokenWithResponse(String cancellationToken, RequestOptions requestOptions) {
        return service.withCancellationTokenSync(this.client.getEndpoint(), cancellationToken, requestOptions);
    }
}
