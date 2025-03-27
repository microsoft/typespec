package specialwords.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

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
        this.service = RestProxy.create(OperationsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpecialWordsClientOperations to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientOp", host = "{endpoint}")
    public interface OperationsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/and",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> andSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/as",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> asSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/assert",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> assertMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/async",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> asyncSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/await",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> awaitSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/break",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> breakMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/class",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> classMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/constructor",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> constructorSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/continue",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> continueMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/def",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/del",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> delSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/elif",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> elifSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/else",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> elseMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/except",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> exceptSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/exec",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> execSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/finally",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> finallyMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/for",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> forMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/from",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> fromSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/global",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> globalSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/if",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> ifMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/import",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> importMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/in",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> inSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/is",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> isSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/lambda",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> lambdaSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/not",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> notSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/or",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> orSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/pass",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> passSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/raise",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> raiseSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/return",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> returnMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/try",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> tryMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/while",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> whileMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/with",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/special-words/operations/yield",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> yieldSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * The and operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> andWithResponse(RequestOptions requestOptions) {
        return service.andSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The as operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> asWithResponse(RequestOptions requestOptions) {
        return service.asSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The assertMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> assertMethodWithResponse(RequestOptions requestOptions) {
        return service.assertMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The async operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> asyncWithResponse(RequestOptions requestOptions) {
        return service.asyncSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The await operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> awaitWithResponse(RequestOptions requestOptions) {
        return service.awaitSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The breakMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> breakMethodWithResponse(RequestOptions requestOptions) {
        return service.breakMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The classMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> classMethodWithResponse(RequestOptions requestOptions) {
        return service.classMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The constructor operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> constructorWithResponse(RequestOptions requestOptions) {
        return service.constructorSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The continueMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> continueMethodWithResponse(RequestOptions requestOptions) {
        return service.continueMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The def operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defWithResponse(RequestOptions requestOptions) {
        return service.defSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The del operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> delWithResponse(RequestOptions requestOptions) {
        return service.delSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The elif operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> elifWithResponse(RequestOptions requestOptions) {
        return service.elifSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The elseMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> elseMethodWithResponse(RequestOptions requestOptions) {
        return service.elseMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The except operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> exceptWithResponse(RequestOptions requestOptions) {
        return service.exceptSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The exec operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> execWithResponse(RequestOptions requestOptions) {
        return service.execSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The finallyMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> finallyMethodWithResponse(RequestOptions requestOptions) {
        return service.finallyMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The forMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> forMethodWithResponse(RequestOptions requestOptions) {
        return service.forMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The from operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> fromWithResponse(RequestOptions requestOptions) {
        return service.fromSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The global operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> globalWithResponse(RequestOptions requestOptions) {
        return service.globalSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The ifMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> ifMethodWithResponse(RequestOptions requestOptions) {
        return service.ifMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The importMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> importMethodWithResponse(RequestOptions requestOptions) {
        return service.importMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The in operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> inWithResponse(RequestOptions requestOptions) {
        return service.inSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The is operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> isWithResponse(RequestOptions requestOptions) {
        return service.isSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The lambda operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> lambdaWithResponse(RequestOptions requestOptions) {
        return service.lambdaSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The not operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> notWithResponse(RequestOptions requestOptions) {
        return service.notSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The or operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> orWithResponse(RequestOptions requestOptions) {
        return service.orSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The pass operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> passWithResponse(RequestOptions requestOptions) {
        return service.passSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The raise operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> raiseWithResponse(RequestOptions requestOptions) {
        return service.raiseSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The returnMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> returnMethodWithResponse(RequestOptions requestOptions) {
        return service.returnMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The tryMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> tryMethodWithResponse(RequestOptions requestOptions) {
        return service.tryMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The whileMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> whileMethodWithResponse(RequestOptions requestOptions) {
        return service.whileMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The with operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withWithResponse(RequestOptions requestOptions) {
        return service.withSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The yield operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> yieldWithResponse(RequestOptions requestOptions) {
        return service.yieldSync(this.client.getEndpoint(), requestOptions);
    }
}
