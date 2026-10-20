package response.statuscoderange.implementation;

import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.lang.reflect.ParameterizedType;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Internal utilities shared by generated protocol implementations.
 */
public final class ClientCoreProtocolUtils {

    private ClientCoreProtocolUtils() {
    }

    public static Response<BinaryData> send(HttpPipeline pipeline, HttpRequest request, RequestContext context) {
        if (context != null) {
            request.setContext(context);
            context.getRequestCallback().accept(request);
        }
        return pipeline.send(request);
    }

    public static <T> Response<T> mapResponse(Response<BinaryData> response, Supplier<T> decoder) {
        try {
            return new Response<>(response.getRequest(), response.getStatusCode(), response.getHeaders(),
                decoder.get());
        } finally {
            response.close();
        }
    }

    public static void handleUnexpectedResponse(Response<BinaryData> response, JsonSerializer jsonSerializer,
        XmlSerializer xmlSerializer, ParameterizedType defaultErrorType, Map<Integer, ParameterizedType> errorTypes,
        ClientLogger logger) {
        // ClientCore's error helper currently requires an XML serializer for XML responses.
        if (xmlSerializer == null
            && CoreUtils.serializationFormatFromContentType(response.getHeaders()) == SerializationFormat.XML) {
            try {
                throw new HttpResponseException("Unexpected XML response.", response, (Object) null);
            } finally {
                response.close();
            }
        }
        GeneratedCodeUtils.handleUnexpectedResponse(response.getStatusCode(), response, jsonSerializer, xmlSerializer,
            defaultErrorType, errorTypes, logger);
    }
}
