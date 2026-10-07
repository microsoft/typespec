package payload.multipart.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import payload.multipart.ComplexHttpPartsModelRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataHttpParts.
 */
public final class FormDataHttpPartsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataHttpPartsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsImpl(MultiPartClientImpl client) {
        this.service = FormDataHttpPartsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface FormDataHttpPartsService {
        static FormDataHttpPartsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new FormDataHttpPartsServiceImpl(pipeline);
        }

        Response<Void> jsonArrayAndFileArray(String endpoint, String contentType, ComplexHttpPartsModelRequest body,
            RequestContext requestContext);
    }

    private static final class FormDataHttpPartsServiceImpl implements FormDataHttpPartsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(FormDataHttpPartsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private FormDataHttpPartsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> jsonArrayAndFileArray(String endpoint, String contentType,
            ComplexHttpPartsModelRequest body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/multipart/form-data/complex-parts-with-httppart");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("content-type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "multipart/form-data");
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
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, FormDataHttpPartsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> jsonArrayAndFileArrayWithResponse(ComplexHttpPartsModelRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.HttpParts.jsonArrayAndFileArray",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.jsonArrayAndFileArray(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(FormDataHttpPartsImpl.class);
}
