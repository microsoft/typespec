// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.requestheaders;

import com.azure.core.http.HttpClient;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpRequest;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.test.http.MockHttpResponse;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.requestheaders.models.MetadataValue;

public class RequestHeadersTests {

    @Test
    public void testRequestHeaderCollection() {
        RequestHeadersClient client
            = new RequestHeadersClientBuilder().endpoint("http://localhost:3000").httpClient(request -> {
                Assertions.assertEquals("value1",
                    request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-key1")));
                Assertions.assertEquals("value2",
                    request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-key2")));
                Assertions.assertNull(request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta")));
                Assertions.assertNull(request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-null")));
                Assertions.assertNull(request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-key3")));
                Assertions.assertEquals("100",
                    request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-priority-level")));
                return Mono.just(new MockHttpResponse(request, 204));
            }).buildClient();

        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("key1", "value1");
        metadata.put("key2", "value2");
        metadata.put(null, "ignored");
        metadata.put("key3", null);
        Response<Void> response
            = client.sendWithResponse(metadata, Map.of("level", MetadataValue.HIGH), new RequestOptions());
        Assertions.assertEquals(204, response.getStatusCode());
    }

    @Test
    public void testByteHeadersAndQuery() {
        AtomicReference<HttpRequest> captured = new AtomicReference<>();
        RequestHeadersClientBuilder builder
            = new RequestHeadersClientBuilder().endpoint("http://localhost:3000").httpClient(captureRequest(captured));
        byte[] contentMD5 = { (byte) 0xfb, (byte) 0xff };
        byte[] xMsContentMD5 = { 0, 1, 2 };
        byte[] crc64 = { (byte) 0xff };

        builder.buildClient().sendBytes(contentMD5, xMsContentMD5, crc64, contentMD5, contentMD5);
        assertByteHeadersAndQuery(captured);

        builder.buildClient().sendBytesWithResponse(contentMD5, xMsContentMD5, crc64, contentMD5, contentMD5, null);
        assertByteHeadersAndQuery(captured);

        builder.buildAsyncClient().sendBytes(contentMD5, xMsContentMD5, crc64, contentMD5, contentMD5).block();
        assertByteHeadersAndQuery(captured);

        builder.buildAsyncClient()
            .sendBytesWithResponse(contentMD5, xMsContentMD5, crc64, contentMD5, contentMD5, new RequestOptions())
            .block();
        assertByteHeadersAndQuery(captured);
    }

    @Test
    public void testNullByteHeadersAndQuery() {
        AtomicReference<HttpRequest> captured = new AtomicReference<>();
        RequestHeadersClient client = new RequestHeadersClientBuilder().endpoint("http://localhost:3000")
            .httpClient(captureRequest(captured))
            .buildClient();

        client.sendBytes(null, null, null, null, null);
        HttpRequest request = captured.get();
        Assertions.assertNull(request.getHeaders().getValue("Content-MD5"));
        Assertions.assertNull(request.getHeaders().getValue("x-ms-content-md5"));
        Assertions.assertNull(request.getHeaders().getValue("x-ms-source-content-crc64"));
        Assertions.assertNull(request.getHeaders().getValue("x-ms-url"));
        Assertions.assertNull(request.getUrl().getQuery());
    }

    private static HttpClient captureRequest(AtomicReference<HttpRequest> captured) {
        return request -> {
            captured.set(request);
            return Mono.just(new MockHttpResponse(request, 204));
        };
    }

    private static void assertByteHeadersAndQuery(AtomicReference<HttpRequest> captured) {
        HttpRequest request = captured.getAndSet(null);
        Assertions.assertNotNull(request);
        Assertions.assertEquals("+/8=", request.getHeaders().getValue("Content-MD5"));
        Assertions.assertEquals("AAEC", request.getHeaders().getValue("x-ms-content-md5"));
        Assertions.assertEquals("/w==", request.getHeaders().getValue("x-ms-source-content-crc64"));
        Assertions.assertEquals("-_8", request.getHeaders().getValue("x-ms-url"));
        Assertions.assertEquals("data=+/8=", URLDecoder.decode(request.getUrl().getQuery(), StandardCharsets.UTF_8));
    }
}
