// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.header;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.test.http.MockHttpResponse;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

public class HeaderTests {

    @Test
    public void testRequestHeaderCollection() {
        HeaderClient client = new HeaderClientBuilder().endpoint("http://localhost:3000").httpClient(request -> {
            Assertions.assertEquals("value1",
                request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-key1")));
            Assertions.assertEquals("value2",
                request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta-key2")));
            Assertions.assertNull(request.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta")));
            return Mono.just(new MockHttpResponse(request, 204));
        }).buildClient();

        client.send(Map.of("key1", "value1", "key2", "value2"));
    }
}
