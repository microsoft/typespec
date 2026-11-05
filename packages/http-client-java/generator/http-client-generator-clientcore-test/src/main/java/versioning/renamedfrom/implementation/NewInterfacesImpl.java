package versioning.renamedfrom.implementation;

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
import versioning.renamedfrom.NewModel;
import versioning.renamedfrom.RenamedFromServiceVersion;

/**
 * An instance of this class provides access to all the operations defined in NewInterfaces.
 */
public final class NewInterfacesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NewInterfacesService service;

    /**
     * The service client containing this operation class.
     */
    private final RenamedFromClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NewInterfacesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NewInterfacesImpl(RenamedFromClientImpl client) {
        this.service = NewInterfacesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RenamedFromServiceVersion getServiceVersion() {
        return client.getServiceVersion();
    }

    public interface NewInterfacesService {
        static NewInterfacesService getNewInstance(HttpPipeline pipeline) {
            return new NewInterfacesServiceImpl(pipeline);
        }

        Response<NewModel> newOpInNewInterface(String endpoint, String version, String contentType, String accept,
            NewModel body, RequestContext requestContext);
    }

    private static final class NewInterfacesServiceImpl implements NewInterfacesService {
        private static final ClientLogger LOGGER = new ClientLogger(NewInterfacesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private NewInterfacesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<NewModel> newOpInNewInterface(String endpoint, String version, String contentType,
            String accept, NewModel body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/versioning/renamed-from/api-version:" + UriEscapers.PATH_ESCAPER.escape(version)
                    + "/interface/test");
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
                    null, null, NewInterfacesServiceImpl.LOGGER);
            }
            try {
                NewModel deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, NewModel.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The newOpInNewInterface operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewModel> newOpInNewInterfaceWithResponse(NewModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.RenamedFrom.NewInterface.newOpInNewInterface",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.newOpInNewInterface(this.client.getEndpoint(),
                    this.client.getServiceVersion().getVersion(), contentType, accept, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(NewInterfacesImpl.class);
}
