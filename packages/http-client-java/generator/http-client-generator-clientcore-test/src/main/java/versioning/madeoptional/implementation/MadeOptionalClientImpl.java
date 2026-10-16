package versioning.madeoptional.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;
import versioning.madeoptional.MadeOptionalServiceVersion;
import versioning.madeoptional.TestModel;

/**
 * Initializes a new instance of the MadeOptionalClient type.
 */
public final class MadeOptionalClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MadeOptionalClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Service version.
     */
    private final MadeOptionalServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public MadeOptionalServiceVersion getServiceVersion() {
        return this.serviceVersion;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of MadeOptionalClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public MadeOptionalClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        MadeOptionalServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = MadeOptionalClientService.getNewInstance(this.httpPipeline);
    }

    public interface MadeOptionalClientService {
        static MadeOptionalClientService getNewInstance(HttpPipeline pipeline) {
            return new MadeOptionalClientServiceImpl(pipeline);
        }

        Response<TestModel> test(String endpoint, String version, String param, String contentType, String accept,
            TestModel body, RequestContext requestContext);
    }

    private static final class MadeOptionalClientServiceImpl implements MadeOptionalClientService {
        private static final ClientLogger LOGGER = new ClientLogger(MadeOptionalClientServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private MadeOptionalClientServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<TestModel> test(String endpoint, String version, String param, String contentType,
            String accept, TestModel body, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/versioning/made-optional/api-version:"
                + UriEscapers.PATH_ESCAPER.escape(version) + "/test");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST).setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, MadeOptionalClientServiceImpl.LOGGER);
            }
            try {
                TestModel deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, TestModel.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(TestModel body, String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.MadeOptional.test", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.test(this.getEndpoint(), this.getServiceVersion().getVersion(), param, contentType,
                    accept, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(MadeOptionalClientImpl.class);
}
