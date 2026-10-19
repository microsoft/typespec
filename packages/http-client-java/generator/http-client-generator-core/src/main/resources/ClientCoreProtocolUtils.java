import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.CoreException;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.lang.reflect.ParameterizedType;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Internal utilities shared by generated protocol implementations.
 */
public final class ClientCoreProtocolUtils {
    private ClientCoreProtocolUtils() {
    }

    public static <T> T readJson(BinaryData body, IOExceptionCheckedFunction<JsonReader, T> decoder,
        ClientLogger logger) {
        byte[] bytes = body == null ? null : body.toBytes();
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        try (JsonReader reader = JsonReader.fromBytes(bytes)) {
            return reader.nextToken() == null ? null : decoder.apply(reader);
        } catch (IOException exception) {
            throw logger.throwableAtError().log(exception, CoreException::from);
        }
    }

    public static byte[] readBase64Url(JsonReader reader) throws IOException {
        return reader.getNullable(nonNullReader -> {
            if (nonNullReader.currentToken() != JsonToken.STRING) {
                throw new IOException("Expected a JSON string for base64url bytes.");
            }
            return new Base64Uri(nonNullReader.getString()).decodedBytes();
        });
    }

    public static <T> T readResponse(Response<BinaryData> response, Supplier<T> decoder) {
        try {
            return decoder.get();
        } finally {
            response.close();
        }
    }

    public static <T> Response<T> mapResponse(Response<BinaryData> response, Supplier<T> decoder) {
        try {
            return new Response<>(response.getRequest(), response.getStatusCode(), response.getHeaders(), decoder.get());
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
