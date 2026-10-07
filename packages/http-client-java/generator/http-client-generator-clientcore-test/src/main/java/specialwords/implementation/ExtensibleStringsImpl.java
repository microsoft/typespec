package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
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
        static ExtensibleStringsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ExtensibleStringsServiceImpl(pipeline);
        }

        Response<ExtensibleString> putExtensibleStringValue(String endpoint, String contentType, String accept,
            ExtensibleString body, RequestContext requestContext);
    }

    private static final class ExtensibleStringsServiceImpl implements ExtensibleStringsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ExtensibleStringsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ExtensibleStringsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ExtensibleString> putExtensibleStringValue(String endpoint, String contentType, String accept,
            ExtensibleString body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/special-words/extensible-strings/string");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("content-type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ExtensibleStringsServiceImpl.LOGGER);
            }
            try {
                ExtensibleString deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, ExtensibleString.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, ExtensibleString.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
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
