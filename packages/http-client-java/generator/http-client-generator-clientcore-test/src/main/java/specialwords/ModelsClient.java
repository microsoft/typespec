package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
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
    @Metadata(generated = true)
    private final ModelsImpl serviceClient;

    /**
     * Initializes an instance of ModelsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ModelsClient(ModelsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The withAnd operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withAndWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withAndWithResponse(body, requestOptions);
    }

    /**
     * The withAs operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withAsWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withAsWithResponse(body, requestOptions);
    }

    /**
     * The withAssert operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withAssertWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withAssertWithResponse(body, requestOptions);
    }

    /**
     * The withAsync operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withAsyncWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withAsyncWithResponse(body, requestOptions);
    }

    /**
     * The withAwait operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withAwaitWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withAwaitWithResponse(body, requestOptions);
    }

    /**
     * The withBreak operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withBreakWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withBreakWithResponse(body, requestOptions);
    }

    /**
     * The withClass operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withClassWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withClassWithResponse(body, requestOptions);
    }

    /**
     * The withConstructor operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withConstructorWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withConstructorWithResponse(body, requestOptions);
    }

    /**
     * The withContinue operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withContinueWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withContinueWithResponse(body, requestOptions);
    }

    /**
     * The withDef operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withDefWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withDefWithResponse(body, requestOptions);
    }

    /**
     * The withDel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withDelWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withDelWithResponse(body, requestOptions);
    }

    /**
     * The withElif operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withElifWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withElifWithResponse(body, requestOptions);
    }

    /**
     * The withElse operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withElseWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withElseWithResponse(body, requestOptions);
    }

    /**
     * The withExcept operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withExceptWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withExceptWithResponse(body, requestOptions);
    }

    /**
     * The withExec operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withExecWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withExecWithResponse(body, requestOptions);
    }

    /**
     * The withFinally operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withFinallyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withFinallyWithResponse(body, requestOptions);
    }

    /**
     * The withFor operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withForWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withForWithResponse(body, requestOptions);
    }

    /**
     * The withFrom operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withFromWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withFromWithResponse(body, requestOptions);
    }

    /**
     * The withGlobal operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withGlobalWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withGlobalWithResponse(body, requestOptions);
    }

    /**
     * The withIf operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withIfWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withIfWithResponse(body, requestOptions);
    }

    /**
     * The withImport operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withImportWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withImportWithResponse(body, requestOptions);
    }

    /**
     * The withIn operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withInWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withInWithResponse(body, requestOptions);
    }

    /**
     * The withIs operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withIsWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withIsWithResponse(body, requestOptions);
    }

    /**
     * The withLambda operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withLambdaWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withLambdaWithResponse(body, requestOptions);
    }

    /**
     * The withNot operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withNotWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withNotWithResponse(body, requestOptions);
    }

    /**
     * The withOr operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withOrWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withOrWithResponse(body, requestOptions);
    }

    /**
     * The withPass operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withPassWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withPassWithResponse(body, requestOptions);
    }

    /**
     * The withRaise operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withRaiseWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withRaiseWithResponse(body, requestOptions);
    }

    /**
     * The withReturn operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withReturnWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withReturnWithResponse(body, requestOptions);
    }

    /**
     * The withTry operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withTryWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withTryWithResponse(body, requestOptions);
    }

    /**
     * The withWhile operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withWhileWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withWhileWithResponse(body, requestOptions);
    }

    /**
     * The withWith operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withWithWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withWithWithResponse(body, requestOptions);
    }

    /**
     * The withYield operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withYieldWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.withYieldWithResponse(body, requestOptions);
    }

    /**
     * The withAnd operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withAnd(And body) {
        // Generated convenience method for withAndWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withAndWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withAs operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withAs(As body) {
        // Generated convenience method for withAsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withAsWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withAssert operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withAssert(Assert body) {
        // Generated convenience method for withAssertWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withAssertWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withAsync operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withAsync(Async body) {
        // Generated convenience method for withAsyncWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withAsyncWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withAwait operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withAwait(Await body) {
        // Generated convenience method for withAwaitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withAwaitWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withBreak operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withBreak(Break body) {
        // Generated convenience method for withBreakWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withBreakWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withClass operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withClass(ClassModel body) {
        // Generated convenience method for withClassWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withClassWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withConstructor operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withConstructor(Constructor body) {
        // Generated convenience method for withConstructorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withConstructorWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withContinue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withContinue(Continue body) {
        // Generated convenience method for withContinueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withContinueWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withDef operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withDef(Def body) {
        // Generated convenience method for withDefWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withDefWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withDel operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withDel(Del body) {
        // Generated convenience method for withDelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withDelWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withElif operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withElif(Elif body) {
        // Generated convenience method for withElifWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withElifWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withElse operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withElse(Else body) {
        // Generated convenience method for withElseWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withElseWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withExcept operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withExcept(Except body) {
        // Generated convenience method for withExceptWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withExceptWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withExec operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withExec(Exec body) {
        // Generated convenience method for withExecWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withExecWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withFinally operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withFinally(Finally body) {
        // Generated convenience method for withFinallyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withFinallyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withFor operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withFor(For body) {
        // Generated convenience method for withForWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withForWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withFrom operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withFrom(From body) {
        // Generated convenience method for withFromWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withFromWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withGlobal operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withGlobal(Global body) {
        // Generated convenience method for withGlobalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withGlobalWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withIf operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withIf(If body) {
        // Generated convenience method for withIfWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withIfWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withImport operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withImport(Import body) {
        // Generated convenience method for withImportWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withImportWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withIn operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withIn(In body) {
        // Generated convenience method for withInWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withInWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withIs operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withIs(Is body) {
        // Generated convenience method for withIsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withIsWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withLambda operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withLambda(Lambda body) {
        // Generated convenience method for withLambdaWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withLambdaWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withNot operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withNot(Not body) {
        // Generated convenience method for withNotWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withNotWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withOr operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withOr(Or body) {
        // Generated convenience method for withOrWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withOrWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withPass operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withPass(Pass body) {
        // Generated convenience method for withPassWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withPassWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withRaise operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withRaise(Raise body) {
        // Generated convenience method for withRaiseWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withRaiseWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withReturn operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withReturn(Return body) {
        // Generated convenience method for withReturnWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withReturnWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withTry operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withTry(Try body) {
        // Generated convenience method for withTryWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withTryWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withWhile operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withWhile(While body) {
        // Generated convenience method for withWhileWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withWhileWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withWith operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withWith(With body) {
        // Generated convenience method for withWithWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withWithWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The withYield operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withYield(Yield body) {
        // Generated convenience method for withYieldWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withYieldWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
