// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.test.http.MockHttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import payload.pageable.models.XmlPet;
import reactor.core.publisher.Mono;

public class XmlPaginationTests {
    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void testStreamedResponseWithNextLink(boolean async) {
        PageableClientBuilder builder
            = new PageableClientBuilder().endpoint("http://localhost:3000").httpClient(request -> {
                boolean nextPage = "/next-page".equals(request.getUrl().getPath());
                String body = "<Page><Pets><Pet><Id>" + (nextPage ? "2" : "1") + "</Id><Name>pet</Name></Pet></Pets>"
                    + (nextPage ? "" : "<NextLink>http://localhost:3000/next-page</NextLink>") + "</Page>";
                return Mono.just(new MockHttpResponse(request, 200,
                    new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml"),
                    body.getBytes(StandardCharsets.UTF_8)));
            });
        List<String> ids = async
            ? builder.buildXmlPaginationAsyncClient().listWithNextLink().map(XmlPet::getId).collectList().block()
            : builder.buildXmlPaginationClient()
                .listWithNextLink()
                .stream()
                .map(XmlPet::getId)
                .collect(Collectors.toList());
        Assertions.assertEquals(List.of("1", "2"), ids);
    }
}
