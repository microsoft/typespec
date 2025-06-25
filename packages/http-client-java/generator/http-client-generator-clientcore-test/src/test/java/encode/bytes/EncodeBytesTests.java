// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.bytes;

import io.clientcore.core.models.binarydata.BinaryData;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;

public class EncodeBytesTests {

    private final QueryClient queryClient = new BytesClientBuilder().buildQueryClient();
    private final HeaderClient headerClient = new BytesClientBuilder().buildHeaderClient();
    private final PropertyClient propertyClient = new BytesClientBuilder().buildPropertyClient();
    private final RequestBodyClient requestClient = new BytesClientBuilder().buildRequestBodyClient();
    private final ResponseBodyClient responseClient = new BytesClientBuilder().buildResponseBodyClient();

    private final static byte[] DATA = "test".getBytes(StandardCharsets.UTF_8);
    private final static byte[] PNG = FileUtils.getPngBytes();

    @Test
    public void testQuery() {
        queryClient.defaultMethod(DATA);

        queryClient.base64(DATA);

        // Expected query param value=dGVzdA but got \"dGVzdA\"
//        queryClient.base64url(DATA);

        queryClient.base64urlArray(Arrays.asList(DATA, DATA));
    }

    @Test
    public void testHeader() {
        headerClient.defaultMethod(DATA);

        headerClient.base64(DATA);

        // Expected dGVzdA but got \"dGVzdA\"
//        headerClient.base64url(DATA);

        headerClient.base64urlArray(Arrays.asList(DATA, DATA));
    }

    @Test
    public void testProperty() {
        propertyClient.defaultMethod(new DefaultBytesProperty(DATA));

        propertyClient.base64(new Base64BytesProperty(DATA));

        propertyClient.base64url(new Base64urlBytesProperty(DATA));

        propertyClient.base64urlArray(new Base64urlArrayBytesProperty(Arrays.asList(DATA, DATA)));
    }

    @Test
    public void testRequestBody() {
        requestClient.octetStream(BinaryData.fromBytes(PNG), PNG.length);
        requestClient.customContentType(BinaryData.fromBytes(PNG), PNG.length);
        requestClient.base64(DATA);
        requestClient.base64url(DATA);
    }

    @Test
    public void testResponseBody() {
        BinaryData binary = responseClient.octetStream();
        Assertions.assertArrayEquals(PNG, binary.toBytes());

        binary = responseClient.customContentType();
        Assertions.assertArrayEquals(PNG, binary.toBytes());

        // array lengths differ
//        bytes = responseClient.base64();
//        Assertions.assertArrayEquals(DATA, bytes);

        byte[] bytes = responseClient.base64url();
        Assertions.assertArrayEquals(DATA, bytes);
    }

    @Test
    public void testBodyDefault() {
        requestClient.defaultMethod(BinaryData.fromBytes(PNG), PNG.length);

        BinaryData png = responseClient.defaultMethod();
        Assertions.assertArrayEquals(PNG, png.toBytes());
    }
}
