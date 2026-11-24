package parameters.bodyoptionality.implementation;

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
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import parameters.bodyoptionality.BodyModel;

/**
 * An instance of this class provides access to all the operations defined in OptionalExplicits.
 */
public final class OptionalExplicitsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final OptionalExplicitsService service;

    /**
     * The service client containing this operation class.
     */
    private final BodyOptionalityClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of OptionalExplicitsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    OptionalExplicitsImpl(BodyOptionalityClientImpl client) {
        this.service = OptionalExplicitsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The HTTP operations for BodyOptionalityClientOptionalExplicits.
     */
    public interface OptionalExplicitsService {
        static OptionalExplicitsService getNewInstance(HttpPipeline pipeline) {
            return new OptionalExplicitsServiceImpl(pipeline);
        }

        Response<Void> set(String endpoint, BodyModel body, RequestContext requestContext);

        Response<Void> omit(String endpoint, BodyModel body, RequestContext requestContext);
    }

    private static final class OptionalExplicitsServiceImpl implements OptionalExplicitsService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(OptionalExplicitsService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private OptionalExplicitsServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> set(String endpoint, BodyModel body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/parameters/body-optionality/optional-explicit/set");
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> omit(String endpoint, BodyModel body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/parameters/body-optionality/optional-explicit/omit");
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }
    }

    /**
     * The set operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> setWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.OptionalExplicit.set",
            requestContext, updatedContext -> {
                return service.set(this.client.getEndpoint(), body, updatedContext);
            });
    }

    /**
     * The omit operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> omitWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.OptionalExplicit.omit",
            requestContext, updatedContext -> {
                return service.omit(this.client.getEndpoint(), body, updatedContext);
            });
    }
}
