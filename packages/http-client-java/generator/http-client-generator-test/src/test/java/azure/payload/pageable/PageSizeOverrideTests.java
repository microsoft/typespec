// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.payload.pageable;

import azure.payload.pageable.models.User;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.UrlBuilder;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

public class PageSizeOverrideTests {

    private static final String ENDPOINT = "https://example.com";
    private static final String NEXT_LINK = ENDPOINT + "/next?skipToken=next";
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final List<String> requests = new ArrayList<>();
    private final PageableClientBuilder builder
        = new PageableClientBuilder().endpoint(ENDPOINT).pipeline(new HttpPipelineBuilder().httpClient(request -> {
            requests.add(request.getUrl().toString());
            String response = UrlBuilder.parse(request.getUrl()).getQuery().containsKey("skipToken")
                ? "{\"value\":[{\"name\":\"second\"}]}"
                : "{\"value\":[{\"name\":\"first\"}],\"nextLink\":\"" + NEXT_LINK + "\"}";
            HttpHeaders headers = new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
            return Mono.just(new MockHttpResponse(request, 200, headers, response.getBytes(StandardCharsets.UTF_8)));
        }).build());

    @Test
    public void typedAsyncForwardsPageSizeOnAllRequests() {
        List<PagedResponse<User>> pages = builder.buildAsyncClient().list().byPage(1).collectList().block(TIMEOUT);

        assertPages(pages, "first", "second");
        Assertions.assertEquals(NEXT_LINK, pages.get(0).getContinuationToken());
        assertRequests("1", 2);
    }

    @Test
    public void typedAsyncForwardsPageSizeFromContinuation() {
        List<PagedResponse<User>> pages
            = builder.buildAsyncClient().list().byPage(NEXT_LINK, 1).collectList().block(TIMEOUT);

        assertPages(pages, "second");
        assertRequests("1", 1);
        Assertions.assertEquals("next", UrlBuilder.parse(requests.get(0)).getQuery().get("skipToken"));
    }

    @Test
    public void typedAsyncPreservesDefaultPaging() {
        List<PagedResponse<User>> pages = builder.buildAsyncClient().list().byPage().collectList().block(TIMEOUT);

        assertPages(pages, "first", "second");
        Assertions.assertEquals(NEXT_LINK, pages.get(0).getContinuationToken());
        assertRequests(null, 2);
    }

    @Test
    public void typedAsyncPreservesDefaultPagingFromContinuation() {
        List<PagedResponse<User>> pages
            = builder.buildAsyncClient().list().byPage(NEXT_LINK).collectList().block(TIMEOUT);

        assertPages(pages, "second");
        assertRequests(null, 1);
        Assertions.assertEquals("next", UrlBuilder.parse(requests.get(0)).getQuery().get("skipToken"));
    }

    @Test
    public void typedAsyncPreservesItemIteration() {
        List<User> users = builder.buildAsyncClient().list().collectList().block(TIMEOUT);

        Assertions.assertNotNull(users);
        Assertions.assertEquals(List.of("first", "second"),
            users.stream().map(User::getName).collect(Collectors.toList()));
        assertRequests(null, 2);
    }

    @Test
    public void protocolAsyncForwardsPageSizeOnAllRequests() {
        builder.buildAsyncClient().list(new RequestOptions()).byPage(1).collectList().block(TIMEOUT);

        assertRequests("1", 2);
    }

    @Test
    public void typedSyncForwardsPageSizeOnAllRequests() {
        List<PagedResponse<User>> pages = builder.buildClient().list().streamByPage(1).collect(Collectors.toList());

        assertPages(pages, "first", "second");
        Assertions.assertEquals(NEXT_LINK, pages.get(0).getContinuationToken());
        assertRequests("1", 2);
    }

    @Test
    public void typedSyncPreservesDefaultPaging() {
        List<PagedResponse<User>> pages = builder.buildClient().list().streamByPage().collect(Collectors.toList());

        assertPages(pages, "first", "second");
        assertRequests(null, 2);
    }

    private void assertRequests(String pageSize, int count) {
        Assertions.assertEquals(count, requests.size(), requests.toString());
        for (String request : requests) {
            Assertions.assertEquals(pageSize, UrlBuilder.parse(request).getQuery().get("maxpagesize"), request);
            String query = URI.create(request).getRawQuery();
            long pageSizeParameters = query == null
                ? 0
                : List.of(query.split("&")).stream().filter(parameter -> parameter.startsWith("maxpagesize=")).count();
            Assertions.assertEquals(pageSize == null ? 0 : 1, pageSizeParameters, request);
        }
    }

    private static void assertPages(List<PagedResponse<User>> pages, String... names) {
        Assertions.assertNotNull(pages);
        Assertions.assertEquals(names.length, pages.size());
        Assertions.assertEquals(List.of(names),
            pages.stream().flatMap(page -> page.getValue().stream()).map(User::getName).collect(Collectors.toList()));
        Assertions.assertNull(pages.get(pages.size() - 1).getContinuationToken());
        for (PagedResponse<User> page : pages) {
            Assertions.assertEquals(200, page.getStatusCode());
            Assertions.assertEquals("application/json", page.getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
            Assertions.assertNotNull(page.getRequest());
        }
    }
}
