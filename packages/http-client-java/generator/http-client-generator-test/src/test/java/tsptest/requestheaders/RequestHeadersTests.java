// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.requestheaders;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.test.http.MockHttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

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
                return Mono.just(new MockHttpResponse(request, 204));
            }).buildClient();

        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("key1", "value1");
        metadata.put("key2", "value2");
        metadata.put(null, "ignored");
        metadata.put("key3", null);
        client.send(metadata);
    }
}
