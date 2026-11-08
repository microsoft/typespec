package encode.bytes.implementation;

import encode.bytes.Base64BytesProperty;
import encode.bytes.Base64urlArrayBytesProperty;
import encode.bytes.Base64urlBytesProperty;
import encode.bytes.DefaultBytesProperty;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.utils.CoreUtils;
import java.lang.reflect.ParameterizedType;

public final class EncodeBytesConstants {
    public static final HttpHeaderName HEADER_VALUE = HttpHeaderName.fromString("value");

    public static final ParameterizedType RESPONSE_OF_DEFAULT_BYTES_PROPERTY_TYPE
        = CoreUtils.createParameterizedType(Response.class, DefaultBytesProperty.class);

    public static final ParameterizedType RESPONSE_OF_BASE64_BYTES_PROPERTY_TYPE
        = CoreUtils.createParameterizedType(Response.class, Base64BytesProperty.class);

    public static final ParameterizedType RESPONSE_OF_BASE64URL_BYTES_PROPERTY_TYPE
        = CoreUtils.createParameterizedType(Response.class, Base64urlBytesProperty.class);

    public static final ParameterizedType RESPONSE_OF_BASE64URL_ARRAY_BYTES_PROPERTY_TYPE
        = CoreUtils.createParameterizedType(Response.class, Base64urlArrayBytesProperty.class);

    private EncodeBytesConstants() {
    }
}
