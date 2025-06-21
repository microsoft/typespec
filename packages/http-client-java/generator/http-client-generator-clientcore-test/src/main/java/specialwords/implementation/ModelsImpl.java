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
import java.lang.reflect.InvocationTargetException;
import specialwords.models.And;
import specialwords.models.As;
import specialwords.models.Assert;
import specialwords.models.Async;
import specialwords.models.Await;
import specialwords.models.Break;
import specialwords.models.ClassModel;
import specialwords.models.Constructor;
import specialwords.models.Continue;
import specialwords.models.Def;
import specialwords.models.Del;
import specialwords.models.Elif;
import specialwords.models.Else;
import specialwords.models.Except;
import specialwords.models.Exec;
import specialwords.models.Finally;
import specialwords.models.For;
import specialwords.models.From;
import specialwords.models.Global;
import specialwords.models.If;
import specialwords.models.Import;
import specialwords.models.In;
import specialwords.models.Is;
import specialwords.models.Lambda;
import specialwords.models.Not;
import specialwords.models.Or;
import specialwords.models.Pass;
import specialwords.models.Raise;
import specialwords.models.Return;
import specialwords.models.Try;
import specialwords.models.While;
import specialwords.models.With;
import specialwords.models.Yield;

/**
 * An instance of this class provides access to all the operations defined in Models.
 */
public final class ModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * Initializes an instance of ModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelsImpl(SpecialWordsClientImpl client) {
        this.service = ModelsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpecialWordsClientModels to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientModels", host = "{endpoint}")
    public interface ModelsService {
        static ModelsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("specialwords.implementation.ModelsServiceImpl");
                return (ModelsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/and",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAnd(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") And body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/as",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAs(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") As body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/assert",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAssert(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Assert body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/async",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAsync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Async body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/await",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withAwait(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Await body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/break",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withBreak(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Break body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/class",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withClass(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") ClassModel body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/constructor",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withConstructor(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Constructor body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/continue",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withContinue(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Continue body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/def",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDef(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Def body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/del",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withDel(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Del body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/elif",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElif(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Elif body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/else",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withElse(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Else body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/except",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExcept(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Except body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/exec",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withExec(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Exec body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/finally",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFinally(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Finally body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/for",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFor(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") For body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/from",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withFrom(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") From body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/global",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withGlobal(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Global body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/if",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIf(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") If body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/import",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withImport(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Import body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/in",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIn(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") In body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/is",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withIs(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Is body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/lambda",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withLambda(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Lambda body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/not",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withNot(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Not body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/or",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withOr(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Or body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/pass",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPass(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Pass body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/raise",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withRaise(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Raise body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/return",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withReturn(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Return body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/try",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withTry(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Try body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/while",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWhile(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") While body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/with",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withWith(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") With body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/models/yield",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withYield(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Yield body,
            RequestContext requestContext);
    }

    /**
     * The withAnd operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(And body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withAnd(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withAs operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(As body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withAs(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withAssert operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(Assert body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withAssert(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withAsync operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(Async body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withAsync(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withAwait operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(Await body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withAwait(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withBreak operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(Break body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withBreak(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withClass operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(ClassModel body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withClass(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withConstructor operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(Constructor body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withConstructor(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withContinue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(Continue body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withContinue(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withDef operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(Def body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withDef(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withDel operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(Del body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withDel(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withElif operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(Elif body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withElif(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withElse operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(Else body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withElse(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withExcept operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(Except body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withExcept(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withExec operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(Exec body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withExec(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withFinally operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(Finally body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withFinally(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withFor operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(For body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withFor(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withFrom operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(From body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withFrom(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withGlobal operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(Global body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withGlobal(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withIf operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(If body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withIf(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withImport operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(Import body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withImport(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withIn operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(In body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withIn(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withIs operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(Is body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withIs(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withLambda operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(Lambda body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withLambda(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withNot operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(Not body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withNot(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withOr operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(Or body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withOr(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withPass operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(Pass body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withPass(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withRaise operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(Raise body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withRaise(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withReturn operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(Return body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withReturn(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withTry operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(Try body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withTry(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withWhile operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(While body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withWhile(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withWith operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(With body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withWith(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * The withYield operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(Yield body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.withYield(this.client.getEndpoint(), contentType, body, requestContext);
    }
}
