// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.test.http.MockHttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import payload.pageable.models.XmlPet;
import reactor.core.publisher.Mono;

public class XmlPaginationTests {
    @ParameterizedTest
    @CsvSource({ "false,false", "false,true", "true,false", "true,true" })
    public void testStreamedResponse(boolean async, boolean continuationToken) {
        PageableClientBuilder builder
            = new PageableClientBuilder().endpoint("http://localhost:3000").httpClient(request -> {
                boolean nextPage = continuationToken
                    ? request.getUrl().getQuery() != null && request.getUrl().getQuery().contains("marker=page2")
                    : "/next-page".equals(request.getUrl().getPath());
                String token = continuationToken
                    ? "<NextMarker>page2</NextMarker>"
                    : "<NextLink>http://localhost:3000/next-page</NextLink>";
                String body = "<Page><Pets><Pet><Id>" + (nextPage ? "2" : "1") + "</Id><Name>pet</Name></Pet></Pets>"
                    + (nextPage ? "" : token) + "</Page>";
                return Mono.just(new MockHttpResponse(request, 200,
                    new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml"),
                    body.getBytes(StandardCharsets.UTF_8)));
            });
        List<String> ids;
        if (async) {
            XmlPaginationAsyncClient client = builder.buildXmlPaginationAsyncClient();
            ids = (continuationToken ? client.listWithContinuation() : client.listWithNextLink()).map(XmlPet::getId)
                .collectList()
                .block(Duration.ofSeconds(10));
        } else {
            XmlPaginationClient client = builder.buildXmlPaginationClient();
            ids = (continuationToken ? client.listWithContinuation() : client.listWithNextLink()).stream()
                .map(XmlPet::getId)
                .collect(Collectors.toList());
        }
        Assertions.assertEquals(List.of("1", "2"), ids);
    }
}
