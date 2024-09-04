// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.encode.bytes;

import com.payload.FileUtils;
import com.azure.core.util.BinaryData;
import com.encode.bytes.models.Base64BytesProperty;
import com.encode.bytes.models.Base64urlArrayBytesProperty;
import com.encode.bytes.models.Base64urlBytesProperty;
import com.encode.bytes.models.DefaultBytesProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

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

        queryClient.base64url(DATA);

        queryClient.base64urlArray(Arrays.asList(DATA, DATA));
    }

    @Test
    public void testHeader() {
        headerClient.defaultMethod(DATA);

        headerClient.base64(DATA);

        headerClient.base64url(DATA);

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
        requestClient.defaultMethod(DATA);
        requestClient.octetStream(BinaryData.fromBytes(PNG));
        requestClient.customContentType(BinaryData.fromBytes(PNG));
        requestClient.base64(DATA);
        requestClient.base64url(DATA);
    }

    @Test
    public void testResponseBody() {
        byte[] bytes = responseClient.defaultMethod();
        Assertions.assertArrayEquals(DATA, bytes);

        BinaryData binary = responseClient.octetStream();
        Assertions.assertArrayEquals(PNG, binary.toBytes());

        binary = responseClient.customContentType();
        Assertions.assertArrayEquals(PNG, binary.toBytes());

        bytes = responseClient.base64();
        Assertions.assertArrayEquals(DATA, bytes);

        bytes = responseClient.base64url();
        Assertions.assertArrayEquals(DATA, bytes);
    }
}
