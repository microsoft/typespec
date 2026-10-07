package payload.multipart.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import payload.multipart.formdata.file.UploadFileArrayRequest;
import payload.multipart.formdata.file.UploadFileRequiredFilenameRequest;
import payload.multipart.formdata.file.UploadFileSpecificContentTypeRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataFiles.
 */
public final class FormDataFilesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataFilesService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataFilesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataFilesImpl(MultiPartClientImpl client) {
        this.service = FormDataFilesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface FormDataFilesService {
        static FormDataFilesService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new FormDataFilesServiceImpl(pipeline);
        }

        Response<Void> uploadFileSpecificContentType(String endpoint, String contentType,
            UploadFileSpecificContentTypeRequest body, RequestContext requestContext);

        Response<Void> uploadFileRequiredFilename(String endpoint, String contentType,
            UploadFileRequiredFilenameRequest body, RequestContext requestContext);

        Response<Void> uploadFileArray(String endpoint, String contentType, UploadFileArrayRequest body,
            RequestContext requestContext);
    }

    private static final class FormDataFilesServiceImpl implements FormDataFilesService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(FormDataFilesServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private FormDataFilesServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> uploadFileSpecificContentType(String endpoint, String contentType,
            UploadFileSpecificContentTypeRequest body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/multipart/form-data/file/specific-content-type");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, FormDataFilesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> uploadFileRequiredFilename(String endpoint, String contentType,
            UploadFileRequiredFilenameRequest body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/multipart/form-data/file/required-filename");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, FormDataFilesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> uploadFileArray(String endpoint, String contentType, UploadFileArrayRequest body,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/multipart/form-data/file/file-array");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, FormDataFilesServiceImpl.LOGGER);
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
     * The uploadFileSpecificContentType operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(UploadFileSpecificContentTypeRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.MultiPart.FormData.File.uploadFileSpecificContentType", requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileSpecificContentType(this.client.getEndpoint(), contentType, body,
                    updatedContext);
            });
    }

    /**
     * The uploadFileRequiredFilename operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileRequiredFilenameWithResponse(UploadFileRequiredFilenameRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileRequiredFilename",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileRequiredFilename(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * The uploadFileArray operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileArrayWithResponse(UploadFileArrayRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.File.uploadFileArray",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.uploadFileArray(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(FormDataFilesImpl.class);
}
