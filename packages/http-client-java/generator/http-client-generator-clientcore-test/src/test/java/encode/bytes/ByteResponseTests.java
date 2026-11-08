// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.bytes;

import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpHeaders;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.util.Base64;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ByteResponseTests {
    private static final byte[] DATA = { (byte) 0xFB, (byte) 0xFF };

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    void decodesJsonBytesAndPreservesResponseMetadata(boolean urlEncoded) {
        String encoded
            = (urlEncoded ? Base64.getUrlEncoder().withoutPadding() : Base64.getEncoder()).encodeToString(DATA);
        TestResponse networkResponse = new TestResponse(BinaryData.fromObject(encoded));

        Response<byte[]> response = send(networkResponse, urlEncoded);

        Assertions.assertArrayEquals(DATA, response.getValue());
        Assertions.assertSame(networkResponse.getRequest(), response.getRequest());
        Assertions.assertSame(networkResponse.getHeaders(), response.getHeaders());
        Assertions.assertEquals(200, response.getStatusCode());
        Assertions.assertTrue(networkResponse.closed);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    void handlesMissingEmptyAndNullJsonBodies(boolean urlEncoded) {
        for (String body : new String[] { null, "", " ", "null" }) {
            TestResponse networkResponse = new TestResponse(body == null ? null : BinaryData.fromString(body));

            Assertions.assertNull(send(networkResponse, urlEncoded).getValue());
            Assertions.assertTrue(networkResponse.closed);
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    void decodesEmptyJsonString(boolean urlEncoded) {
        TestResponse networkResponse = new TestResponse(BinaryData.fromString("\"\""));

        Assertions.assertArrayEquals(new byte[0], send(networkResponse, urlEncoded).getValue());
        Assertions.assertTrue(networkResponse.closed);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    void closesResponseWhenDecodingFails(boolean urlEncoded) {
        for (String body : new String[] { "\"%%%\"", "[", "[]", "{}", "true", "42", "\"unterminated" }) {
            TestResponse networkResponse = new TestResponse(BinaryData.fromString(body));

            Assertions.assertThrows(RuntimeException.class, () -> send(networkResponse, urlEncoded), body);
            Assertions.assertTrue(networkResponse.closed, body);
        }
    }

    @Test
    void leavesRawBinaryResponseOpenForCaller() {
        TestResponse networkResponse = new TestResponse(BinaryData.fromBytes(DATA));
        networkResponse.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/octet-stream");
        ResponseBodyClient client = client(networkResponse);

        try (Response<BinaryData> response = client.octetStreamWithResponse(RequestContext.none())) {
            Assertions.assertSame(networkResponse, response);
            Assertions.assertArrayEquals(DATA, response.getValue().toBytes());
            Assertions.assertFalse(networkResponse.closed);
        }
        Assertions.assertTrue(networkResponse.closed);
    }

    private static Response<byte[]> send(TestResponse response, boolean urlEncoded) {
        ResponseBodyClient client = client(response);
        return urlEncoded
            ? client.base64urlWithResponse(RequestContext.none())
            : client.base64WithResponse(RequestContext.none());
    }

    private static ResponseBodyClient client(TestResponse response) {
        return new BytesClientBuilder().httpClient(request -> response).buildResponseBodyClient();
    }

    private static final class TestResponse extends Response<BinaryData> {
        private boolean closed;

        private TestResponse(BinaryData body) {
            super(new HttpRequest().setMethod(HttpMethod.GET).setUri("http://localhost"), 200,
                new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json"), body);
        }

        @Override
        public void close() {
            closed = true;
            super.close();
        }
    }
}
