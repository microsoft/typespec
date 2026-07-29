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
import specialwords.implementation.OperationsImpl;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class OperationsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of OperationsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    OperationsClient(OperationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> andWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.and", requestContext,
            updatedContext -> this.serviceClient.andWithResponse(updatedContext));
    }

    /**
     * The and operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void and() {
        andWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.as", requestContext,
            updatedContext -> this.serviceClient.asWithResponse(updatedContext));
    }

    /**
     * The as operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void as() {
        asWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> assertMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.assert", requestContext,
            updatedContext -> this.serviceClient.assertMethodWithResponse(updatedContext));
    }

    /**
     * The assertMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void assertMethod() {
        assertMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> asyncWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.async", requestContext,
            updatedContext -> this.serviceClient.asyncWithResponse(updatedContext));
    }

    /**
     * The async operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void async() {
        asyncWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> awaitWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.await", requestContext,
            updatedContext -> this.serviceClient.awaitWithResponse(updatedContext));
    }

    /**
     * The await operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void await() {
        awaitWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> breakMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.break", requestContext,
            updatedContext -> this.serviceClient.breakMethodWithResponse(updatedContext));
    }

    /**
     * The breakMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void breakMethod() {
        breakMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> classMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.class", requestContext,
            updatedContext -> this.serviceClient.classMethodWithResponse(updatedContext));
    }

    /**
     * The classMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void classMethod() {
        classMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> constructorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.constructor", requestContext,
            updatedContext -> this.serviceClient.constructorWithResponse(updatedContext));
    }

    /**
     * The constructor operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void constructor() {
        constructorWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> continueMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.continue", requestContext,
            updatedContext -> this.serviceClient.continueMethodWithResponse(updatedContext));
    }

    /**
     * The continueMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void continueMethod() {
        continueMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.def", requestContext,
            updatedContext -> this.serviceClient.defWithResponse(updatedContext));
    }

    /**
     * The def operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void def() {
        defWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> delWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.del", requestContext,
            updatedContext -> this.serviceClient.delWithResponse(updatedContext));
    }

    /**
     * The del operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void del() {
        delWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elifWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.elif", requestContext,
            updatedContext -> this.serviceClient.elifWithResponse(updatedContext));
    }

    /**
     * The elif operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void elif() {
        elifWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> elseMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.else", requestContext,
            updatedContext -> this.serviceClient.elseMethodWithResponse(updatedContext));
    }

    /**
     * The elseMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void elseMethod() {
        elseMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> exceptWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.except", requestContext,
            updatedContext -> this.serviceClient.exceptWithResponse(updatedContext));
    }

    /**
     * The except operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void except() {
        exceptWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> execWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.exec", requestContext,
            updatedContext -> this.serviceClient.execWithResponse(updatedContext));
    }

    /**
     * The exec operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void exec() {
        execWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> finallyMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.finally", requestContext,
            updatedContext -> this.serviceClient.finallyMethodWithResponse(updatedContext));
    }

    /**
     * The finallyMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void finallyMethod() {
        finallyMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> forMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.for", requestContext,
            updatedContext -> this.serviceClient.forMethodWithResponse(updatedContext));
    }

    /**
     * The forMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void forMethod() {
        forMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fromWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.from", requestContext,
            updatedContext -> this.serviceClient.fromWithResponse(updatedContext));
    }

    /**
     * The from operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void from() {
        fromWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> globalWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.global", requestContext,
            updatedContext -> this.serviceClient.globalWithResponse(updatedContext));
    }

    /**
     * The global operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void global() {
        globalWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> ifMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.if", requestContext,
            updatedContext -> this.serviceClient.ifMethodWithResponse(updatedContext));
    }

    /**
     * The ifMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void ifMethod() {
        ifMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> importMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.import", requestContext,
            updatedContext -> this.serviceClient.importMethodWithResponse(updatedContext));
    }

    /**
     * The importMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void importMethod() {
        importMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> inWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.in", requestContext,
            updatedContext -> this.serviceClient.inWithResponse(updatedContext));
    }

    /**
     * The in operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void in() {
        inWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> isWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.is", requestContext,
            updatedContext -> this.serviceClient.isWithResponse(updatedContext));
    }

    /**
     * The is operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void is() {
        isWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> lambdaWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.lambda", requestContext,
            updatedContext -> this.serviceClient.lambdaWithResponse(updatedContext));
    }

    /**
     * The lambda operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void lambda() {
        lambdaWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> notWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.not", requestContext,
            updatedContext -> this.serviceClient.notWithResponse(updatedContext));
    }

    /**
     * The not operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void not() {
        notWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> orWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.or", requestContext,
            updatedContext -> this.serviceClient.orWithResponse(updatedContext));
    }

    /**
     * The or operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void or() {
        orWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> passWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.pass", requestContext,
            updatedContext -> this.serviceClient.passWithResponse(updatedContext));
    }

    /**
     * The pass operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void pass() {
        passWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> raiseWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.raise", requestContext,
            updatedContext -> this.serviceClient.raiseWithResponse(updatedContext));
    }

    /**
     * The raise operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void raise() {
        raiseWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> returnMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.return", requestContext,
            updatedContext -> this.serviceClient.returnMethodWithResponse(updatedContext));
    }

    /**
     * The returnMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void returnMethod() {
        returnMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> tryMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.try", requestContext,
            updatedContext -> this.serviceClient.tryMethodWithResponse(updatedContext));
    }

    /**
     * The tryMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void tryMethod() {
        tryMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> whileMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.while", requestContext,
            updatedContext -> this.serviceClient.whileMethodWithResponse(updatedContext));
    }

    /**
     * The whileMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void whileMethod() {
        whileMethodWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.with", requestContext,
            updatedContext -> this.serviceClient.withWithResponse(updatedContext));
    }

    /**
     * The with operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void with() {
        withWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> yieldWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Operations.yield", requestContext,
            updatedContext -> this.serviceClient.yieldWithResponse(updatedContext));
    }

    /**
     * The yield operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void yield() {
        yieldWithResponse(RequestContext.none());
    }
}
