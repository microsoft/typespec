package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import specialwords.implementation.ModelsImpl;
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
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ModelsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ModelsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ModelsClient(ModelsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The withAnd operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(And body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withAnd", requestContext,
            updatedContext -> this.serviceClient.withAndWithResponse(body, updatedContext));
    }

    /**
     * The withAnd operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAnd(And body) {
        withAndWithResponse(body, RequestContext.none());
    }

    /**
     * The withAs operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(As body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withAs", requestContext,
            updatedContext -> this.serviceClient.withAsWithResponse(body, updatedContext));
    }

    /**
     * The withAs operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAs(As body) {
        withAsWithResponse(body, RequestContext.none());
    }

    /**
     * The withAssert operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(Assert body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withAssert", requestContext,
            updatedContext -> this.serviceClient.withAssertWithResponse(body, updatedContext));
    }

    /**
     * The withAssert operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAssert(Assert body) {
        withAssertWithResponse(body, RequestContext.none());
    }

    /**
     * The withAsync operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(Async body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withAsync", requestContext,
            updatedContext -> this.serviceClient.withAsyncWithResponse(body, updatedContext));
    }

    /**
     * The withAsync operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAsync(Async body) {
        withAsyncWithResponse(body, RequestContext.none());
    }

    /**
     * The withAwait operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(Await body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withAwait", requestContext,
            updatedContext -> this.serviceClient.withAwaitWithResponse(body, updatedContext));
    }

    /**
     * The withAwait operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withAwait(Await body) {
        withAwaitWithResponse(body, RequestContext.none());
    }

    /**
     * The withBreak operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(Break body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withBreak", requestContext,
            updatedContext -> this.serviceClient.withBreakWithResponse(body, updatedContext));
    }

    /**
     * The withBreak operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withBreak(Break body) {
        withBreakWithResponse(body, RequestContext.none());
    }

    /**
     * The withClass operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(ClassModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withClass", requestContext,
            updatedContext -> this.serviceClient.withClassWithResponse(body, updatedContext));
    }

    /**
     * The withClass operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withClass(ClassModel body) {
        withClassWithResponse(body, RequestContext.none());
    }

    /**
     * The withConstructor operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(Constructor body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withConstructor", requestContext,
            updatedContext -> this.serviceClient.withConstructorWithResponse(body, updatedContext));
    }

    /**
     * The withConstructor operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withConstructor(Constructor body) {
        withConstructorWithResponse(body, RequestContext.none());
    }

    /**
     * The withContinue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(Continue body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withContinue", requestContext,
            updatedContext -> this.serviceClient.withContinueWithResponse(body, updatedContext));
    }

    /**
     * The withContinue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withContinue(Continue body) {
        withContinueWithResponse(body, RequestContext.none());
    }

    /**
     * The withDef operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(Def body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withDef", requestContext,
            updatedContext -> this.serviceClient.withDefWithResponse(body, updatedContext));
    }

    /**
     * The withDef operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withDef(Def body) {
        withDefWithResponse(body, RequestContext.none());
    }

    /**
     * The withDel operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(Del body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withDel", requestContext,
            updatedContext -> this.serviceClient.withDelWithResponse(body, updatedContext));
    }

    /**
     * The withDel operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withDel(Del body) {
        withDelWithResponse(body, RequestContext.none());
    }

    /**
     * The withElif operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(Elif body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withElif", requestContext,
            updatedContext -> this.serviceClient.withElifWithResponse(body, updatedContext));
    }

    /**
     * The withElif operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withElif(Elif body) {
        withElifWithResponse(body, RequestContext.none());
    }

    /**
     * The withElse operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(Else body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withElse", requestContext,
            updatedContext -> this.serviceClient.withElseWithResponse(body, updatedContext));
    }

    /**
     * The withElse operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withElse(Else body) {
        withElseWithResponse(body, RequestContext.none());
    }

    /**
     * The withExcept operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(Except body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withExcept", requestContext,
            updatedContext -> this.serviceClient.withExceptWithResponse(body, updatedContext));
    }

    /**
     * The withExcept operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withExcept(Except body) {
        withExceptWithResponse(body, RequestContext.none());
    }

    /**
     * The withExec operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(Exec body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withExec", requestContext,
            updatedContext -> this.serviceClient.withExecWithResponse(body, updatedContext));
    }

    /**
     * The withExec operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withExec(Exec body) {
        withExecWithResponse(body, RequestContext.none());
    }

    /**
     * The withFinally operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(Finally body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withFinally", requestContext,
            updatedContext -> this.serviceClient.withFinallyWithResponse(body, updatedContext));
    }

    /**
     * The withFinally operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFinally(Finally body) {
        withFinallyWithResponse(body, RequestContext.none());
    }

    /**
     * The withFor operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(For body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withFor", requestContext,
            updatedContext -> this.serviceClient.withForWithResponse(body, updatedContext));
    }

    /**
     * The withFor operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFor(For body) {
        withForWithResponse(body, RequestContext.none());
    }

    /**
     * The withFrom operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(From body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withFrom", requestContext,
            updatedContext -> this.serviceClient.withFromWithResponse(body, updatedContext));
    }

    /**
     * The withFrom operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withFrom(From body) {
        withFromWithResponse(body, RequestContext.none());
    }

    /**
     * The withGlobal operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(Global body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withGlobal", requestContext,
            updatedContext -> this.serviceClient.withGlobalWithResponse(body, updatedContext));
    }

    /**
     * The withGlobal operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withGlobal(Global body) {
        withGlobalWithResponse(body, RequestContext.none());
    }

    /**
     * The withIf operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(If body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withIf", requestContext,
            updatedContext -> this.serviceClient.withIfWithResponse(body, updatedContext));
    }

    /**
     * The withIf operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIf(If body) {
        withIfWithResponse(body, RequestContext.none());
    }

    /**
     * The withImport operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(Import body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withImport", requestContext,
            updatedContext -> this.serviceClient.withImportWithResponse(body, updatedContext));
    }

    /**
     * The withImport operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withImport(Import body) {
        withImportWithResponse(body, RequestContext.none());
    }

    /**
     * The withIn operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(In body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withIn", requestContext,
            updatedContext -> this.serviceClient.withInWithResponse(body, updatedContext));
    }

    /**
     * The withIn operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIn(In body) {
        withInWithResponse(body, RequestContext.none());
    }

    /**
     * The withIs operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(Is body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withIs", requestContext,
            updatedContext -> this.serviceClient.withIsWithResponse(body, updatedContext));
    }

    /**
     * The withIs operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withIs(Is body) {
        withIsWithResponse(body, RequestContext.none());
    }

    /**
     * The withLambda operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(Lambda body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withLambda", requestContext,
            updatedContext -> this.serviceClient.withLambdaWithResponse(body, updatedContext));
    }

    /**
     * The withLambda operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withLambda(Lambda body) {
        withLambdaWithResponse(body, RequestContext.none());
    }

    /**
     * The withNot operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(Not body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withNot", requestContext,
            updatedContext -> this.serviceClient.withNotWithResponse(body, updatedContext));
    }

    /**
     * The withNot operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withNot(Not body) {
        withNotWithResponse(body, RequestContext.none());
    }

    /**
     * The withOr operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(Or body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withOr", requestContext,
            updatedContext -> this.serviceClient.withOrWithResponse(body, updatedContext));
    }

    /**
     * The withOr operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withOr(Or body) {
        withOrWithResponse(body, RequestContext.none());
    }

    /**
     * The withPass operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(Pass body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withPass", requestContext,
            updatedContext -> this.serviceClient.withPassWithResponse(body, updatedContext));
    }

    /**
     * The withPass operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPass(Pass body) {
        withPassWithResponse(body, RequestContext.none());
    }

    /**
     * The withRaise operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(Raise body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withRaise", requestContext,
            updatedContext -> this.serviceClient.withRaiseWithResponse(body, updatedContext));
    }

    /**
     * The withRaise operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withRaise(Raise body) {
        withRaiseWithResponse(body, RequestContext.none());
    }

    /**
     * The withReturn operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(Return body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withReturn", requestContext,
            updatedContext -> this.serviceClient.withReturnWithResponse(body, updatedContext));
    }

    /**
     * The withReturn operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withReturn(Return body) {
        withReturnWithResponse(body, RequestContext.none());
    }

    /**
     * The withTry operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(Try body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withTry", requestContext,
            updatedContext -> this.serviceClient.withTryWithResponse(body, updatedContext));
    }

    /**
     * The withTry operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withTry(Try body) {
        withTryWithResponse(body, RequestContext.none());
    }

    /**
     * The withWhile operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(While body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withWhile", requestContext,
            updatedContext -> this.serviceClient.withWhileWithResponse(body, updatedContext));
    }

    /**
     * The withWhile operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withWhile(While body) {
        withWhileWithResponse(body, RequestContext.none());
    }

    /**
     * The withWith operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(With body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withWith", requestContext,
            updatedContext -> this.serviceClient.withWithWithResponse(body, updatedContext));
    }

    /**
     * The withWith operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withWith(With body) {
        withWithWithResponse(body, RequestContext.none());
    }

    /**
     * The withYield operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(Yield body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Models.withYield", requestContext,
            updatedContext -> this.serviceClient.withYieldWithResponse(body, updatedContext));
    }

    /**
     * The withYield operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withYield(Yield body) {
        withYieldWithResponse(body, RequestContext.none());
    }
}
