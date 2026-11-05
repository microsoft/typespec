package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import specialwords.extensiblestrings.ExtensibleString;

/**
 * An instance of this class provides access to all the operations defined in ExtensibleStrings.
 */
public final class ExtensibleStringsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExtensibleStringsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtensibleStringsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExtensibleStringsImpl(SpecialWordsClientImpl client) {
        this.service = ExtensibleStringsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ExtensibleStringsService {
        static ExtensibleStringsService getNewInstance(HttpPipeline pipeline) {
            return new ExtensibleStringsServiceImpl(pipeline);
        }

        Response<ExtensibleString> putExtensibleStringValue(String endpoint, String contentType, String accept,
            ExtensibleString body, RequestContext requestContext);
    }

    private static final class ExtensibleStringsServiceImpl implements ExtensibleStringsService {
        private static final ClientLogger LOGGER = new ClientLogger(ExtensibleStringsServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private ExtensibleStringsServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ExtensibleString> putExtensibleStringValue(String endpoint, String contentType, String accept,
            ExtensibleString body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/special-words/extensible-strings/string");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
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
                    null, null, ExtensibleStringsServiceImpl.LOGGER);
            }
            try {
                ExtensibleString deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, ExtensibleString.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The putExtensibleStringValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return verify enum member names that are special words using extensible enum (union) along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ExtensibleString> putExtensibleStringValueWithResponse(ExtensibleString body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ExtensibleStrings.putExtensibleStringValue",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.putExtensibleStringValue(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ExtensibleStringsImpl.class);
}
