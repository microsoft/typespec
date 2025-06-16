package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import specialwords.implementation.ParametersImpl;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ParametersClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ParametersImpl serviceClient;

    /**
     * Initializes an instance of ParametersClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ParametersClient(ParametersImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(String and, RequestContext requestContext) {
        return this.serviceClient.withAndWithResponse(and, requestContext);
    }

    /**
     * The withAnd operation.
     * 
     * @param and The and parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(String as, RequestContext requestContext) {
        return this.serviceClient.withAsWithResponse(as, requestContext);
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(String assertParameter, RequestContext requestContext) {
        return this.serviceClient.withAssertWithResponse(assertParameter, requestContext);
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(String async, RequestContext requestContext) {
        return this.serviceClient.withAsyncWithResponse(async, requestContext);
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(String await, RequestContext requestContext) {
        return this.serviceClient.withAwaitWithResponse(await, requestContext);
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(String breakParameter, RequestContext requestContext) {
        return this.serviceClient.withBreakWithResponse(breakParameter, requestContext);
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(String classParameter, RequestContext requestContext) {
        return this.serviceClient.withClassWithResponse(classParameter, requestContext);
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(String constructor, RequestContext requestContext) {
        return this.serviceClient.withConstructorWithResponse(constructor, requestContext);
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(String continueParameter, RequestContext requestContext) {
        return this.serviceClient.withContinueWithResponse(continueParameter, requestContext);
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(String def, RequestContext requestContext) {
        return this.serviceClient.withDefWithResponse(def, requestContext);
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(String del, RequestContext requestContext) {
        return this.serviceClient.withDelWithResponse(del, requestContext);
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(String elif, RequestContext requestContext) {
        return this.serviceClient.withElifWithResponse(elif, requestContext);
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(String elseParameter, RequestContext requestContext) {
        return this.serviceClient.withElseWithResponse(elseParameter, requestContext);
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(String except, RequestContext requestContext) {
        return this.serviceClient.withExceptWithResponse(except, requestContext);
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(String exec, RequestContext requestContext) {
        return this.serviceClient.withExecWithResponse(exec, requestContext);
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(String finallyParameter, RequestContext requestContext) {
        return this.serviceClient.withFinallyWithResponse(finallyParameter, requestContext);
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(String forParameter, RequestContext requestContext) {
        return this.serviceClient.withForWithResponse(forParameter, requestContext);
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(String from, RequestContext requestContext) {
        return this.serviceClient.withFromWithResponse(from, requestContext);
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(String global, RequestContext requestContext) {
        return this.serviceClient.withGlobalWithResponse(global, requestContext);
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(String ifParameter, RequestContext requestContext) {
        return this.serviceClient.withIfWithResponse(ifParameter, requestContext);
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(String importParameter, RequestContext requestContext) {
        return this.serviceClient.withImportWithResponse(importParameter, requestContext);
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(String in, RequestContext requestContext) {
        return this.serviceClient.withInWithResponse(in, requestContext);
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(String is, RequestContext requestContext) {
        return this.serviceClient.withIsWithResponse(is, requestContext);
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(String lambda, RequestContext requestContext) {
        return this.serviceClient.withLambdaWithResponse(lambda, requestContext);
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(String not, RequestContext requestContext) {
        return this.serviceClient.withNotWithResponse(not, requestContext);
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(String or, RequestContext requestContext) {
        return this.serviceClient.withOrWithResponse(or, requestContext);
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(String pass, RequestContext requestContext) {
        return this.serviceClient.withPassWithResponse(pass, requestContext);
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(String raise, RequestContext requestContext) {
        return this.serviceClient.withRaiseWithResponse(raise, requestContext);
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(String returnParameter, RequestContext requestContext) {
        return this.serviceClient.withReturnWithResponse(returnParameter, requestContext);
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(String tryParameter, RequestContext requestContext) {
        return this.serviceClient.withTryWithResponse(tryParameter, requestContext);
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(String whileParameter, RequestContext requestContext) {
        return this.serviceClient.withWhileWithResponse(whileParameter, requestContext);
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(String with, RequestContext requestContext) {
        return this.serviceClient.withWithWithResponse(with, requestContext);
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(String yield, RequestContext requestContext) {
        return this.serviceClient.withYieldWithResponse(yield, requestContext);
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withCancellationTokenWithResponse(String cancellationToken, RequestContext requestContext) {
        return this.serviceClient.withCancellationTokenWithResponse(cancellationToken, requestContext);
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withCancellationToken(String cancellationToken) {
        withCancellationTokenWithResponse(cancellationToken, RequestContext.none());
    }
}
