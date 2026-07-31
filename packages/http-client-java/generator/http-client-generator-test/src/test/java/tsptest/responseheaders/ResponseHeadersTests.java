// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.responseheaders;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.test.http.MockHttpResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.responseheaders.models.ResponseHeaderOpsGetResourceMetadataHeaders;

public class ResponseHeadersTests {

    private ResponseHeadersClient createClient(HttpHeaders responseHeaders) {
        return new ResponseHeadersClientBuilder().endpoint("http://localhost:3000")
            .httpClient(request -> Mono.just(new MockHttpResponse(request, 200, responseHeaders)))
            .buildClient();
    }

    @Test
    public void testResponseHeadersAsModel() {
        HttpHeaders responseHeaders = new HttpHeaders().set(HttpHeaderName.ETAG, "\"0x8D9\"")
            .set(HttpHeaderName.fromString("x-resource-count"), "42")
            .set(HttpHeaderName.LAST_MODIFIED, "Mon, 26 Aug 2022 14:38:00 GMT");

        ResponseHeaderOpsGetResourceMetadataHeaders headers = createClient(responseHeaders).getResourceMetadata();

        // the convenience method returns a strongly-typed header model built from the response headers,
        // instead of "void"; the model itself has no JSON/XML serialization.
        Assertions.assertEquals("\"0x8D9\"", headers.getETag());
        Assertions.assertEquals(42, headers.getResourceCount());
        Assertions.assertEquals(OffsetDateTime.of(2022, 8, 26, 14, 38, 0, 0, ZoneOffset.UTC),
            headers.getLastModified());
    }

    @Test
    public void testOptionalHeaderAbsent() {
        // "Last-Modified" is an optional header; when absent, the model property is null.
        HttpHeaders responseHeaders = new HttpHeaders().set(HttpHeaderName.ETAG, "\"0x8D9\"")
            .set(HttpHeaderName.fromString("x-resource-count"), "7");

        ResponseHeaderOpsGetResourceMetadataHeaders headers = createClient(responseHeaders).getResourceMetadata();

        Assertions.assertEquals("\"0x8D9\"", headers.getETag());
        Assertions.assertEquals(7, headers.getResourceCount());
        Assertions.assertNull(headers.getLastModified());
    }
}
