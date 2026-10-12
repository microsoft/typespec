package payload.multipart.implementation;

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
import payload.multipart.FileWithHttpPartOptionalContentTypeRequest;
import payload.multipart.FileWithHttpPartRequiredContentTypeRequest;
import payload.multipart.FileWithHttpPartSpecificContentTypeRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataHttpPartsContentTypes.
 */
public final class FormDataHttpPartsContentTypesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsContentTypesService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataHttpPartsContentTypesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsContentTypesImpl(MultiPartClientImpl client) {
        this.service = FormDataHttpPartsContentTypesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface FormDataHttpPartsContentTypesService {
        static FormDataHttpPartsContentTypesService getNewInstance(HttpPipeline pipeline) {
            return new FormDataHttpPartsContentTypesServiceImpl(pipeline);
        }

        Response<Void> imageJpegContentType(String endpoint, String contentType,
            FileWithHttpPartSpecificContentTypeRequest body, RequestContext requestContext);

        Response<Void> requiredContentType(String endpoint, String contentType,
            FileWithHttpPartRequiredContentTypeRequest body, RequestContext requestContext);

        Response<Void> optionalContentType(String endpoint, String contentType,
            FileWithHttpPartOptionalContentTypeRequest body, RequestContext requestContext);
    }

    private static final class FormDataHttpPartsContentTypesServiceImpl
        implements FormDataHttpPartsContentTypesService {
        private static final ClientLogger LOGGER = new ClientLogger(FormDataHttpPartsContentTypesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private FormDataHttpPartsContentTypesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> imageJpegContentType(String endpoint, String contentType,
            FileWithHttpPartSpecificContentTypeRequest body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/multipart/form-data/check-filename-and-specific-content-type-with-httppart");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "multipart/form-data");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, FormDataHttpPartsContentTypesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> requiredContentType(String endpoint, String contentType,
            FileWithHttpPartRequiredContentTypeRequest body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/multipart/form-data/check-filename-and-required-content-type-with-httppart");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "multipart/form-data");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, FormDataHttpPartsContentTypesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> optionalContentType(String endpoint, String contentType,
            FileWithHttpPartOptionalContentTypeRequest body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/multipart/form-data/file-with-http-part-optional-content-type");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "multipart/form-data");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, FormDataHttpPartsContentTypesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> imageJpegContentTypeWithResponse(FileWithHttpPartSpecificContentTypeRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.imageJpegContentType", requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.imageJpegContentType(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredContentTypeWithResponse(FileWithHttpPartRequiredContentTypeRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.requiredContentType", requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.requiredContentType(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data for optional content type.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> optionalContentTypeWithResponse(FileWithHttpPartOptionalContentTypeRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.HttpParts.ContentType.optionalContentType", requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.optionalContentType(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(FormDataHttpPartsContentTypesImpl.class);
}
