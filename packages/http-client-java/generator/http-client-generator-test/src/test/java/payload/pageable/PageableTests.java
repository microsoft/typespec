// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.RequestOptions;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import payload.pageable.models.Pet;
import payload.pageable.models.XmlPet;
import payload.pageable.serverdrivenpagination.alternateinitialverb.models.Filter;
import reactor.core.publisher.Flux;

public class PageableTests {

    private final PageableClientBuilder builder = new PageableClientBuilder();

    @Test
    public void testLink() {
        assertPetIds(builder.buildServerDrivenPaginationClient().link());
    }

    @Test
    public void testLinkString() {
        assertPetIds(builder.buildServerDrivenPaginationClient().linkString());
    }

    @Test
    public void testNestedLink() {
        assertPetIds(builder.buildServerDrivenPaginationClient().nestedLink());
    }

    @Test
    public void testListWithoutContinuation() {
        assertPetIds(builder.buildPageSizeClient().listWithoutContinuation());
    }

    @Test
    public void testListWithPageSize() {
        assertPetIds(builder.buildPageSizeClient().listWithPageSize(2), "1", "2");
    }

    @Test
    public void testPost() {
        assertPetIds(builder.buildServerDrivenPaginationAlternateInitialVerbClient().post(new Filter("foo eq bar")));
    }

    @Test
    public void testXmlListWithNextLink() {
        PagedIterable<XmlPet> pagedIterable = builder.buildXmlPaginationClient().listWithNextLink();

        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(XmlPet::getId).collect(Collectors.toList()));
    }

    @Test
    public void testContinuationToken() {
        ServerDrivenPaginationContinuationTokenClient client
            = builder.buildServerDrivenPaginationContinuationTokenClient();
        assertPetIds(client.requestQueryResponseBody(null, "foo", "bar"));
        assertPetIds(client.requestHeaderResponseBody(null, "foo", "bar"));
        assertPetIds(client.requestQueryResponseHeader(null, "foo", "bar"));
        assertPetIds(client.requestHeaderResponseHeader(null, "foo", "bar"));
        assertPetIds(client.requestQueryNestedResponseBody(null, "foo", "bar"));
        assertPetIds(client.requestHeaderNestedResponseBody(null, "foo", "bar"));
    }

    @Test
    public void testContinuationTokenAsync() {
        ServerDrivenPaginationContinuationTokenAsyncClient client
            = builder.buildServerDrivenPaginationContinuationTokenAsyncClient();
        List<Flux<Pet>> results = List.of(client.requestQueryResponseBody(null, "foo", "bar"),
            client.requestHeaderResponseBody(null, "foo", "bar"), client.requestQueryResponseHeader(null, "foo", "bar"),
            client.requestHeaderResponseHeader(null, "foo", "bar"),
            client.requestQueryNestedResponseBody(null, "foo", "bar"),
            client.requestHeaderNestedResponseBody(null, "foo", "bar"));
        for (Flux<Pet> result : results) {
            Assertions.assertEquals(List.of("1", "2", "3", "4"),
                result.map(Pet::getId).collectList().block(Duration.ofSeconds(10)));
        }
    }

    @Test
    public void testResumeWithContinuationToken() {
        ServerDrivenPaginationContinuationTokenClient client
            = builder.buildServerDrivenPaginationContinuationTokenClient();
        Assertions.assertEquals(List.of("3", "4"),
            client.requestQueryResponseBody("ignored", "foo", "bar")
                .streamByPage("page2")
                .flatMap(page -> page.getValue().stream())
                .map(Pet::getId)
                .collect(Collectors.toList()));
        Assertions.assertEquals(List.of("3", "4"),
            client.requestHeaderResponseHeader("ignored", "foo", "bar")
                .streamByPage("page2")
                .flatMap(page -> page.getValue().stream())
                .map(Pet::getId)
                .collect(Collectors.toList()));
        Assertions.assertEquals(List.of("3", "4"),
            builder.buildServerDrivenPaginationContinuationTokenAsyncClient()
                .requestQueryNestedResponseBody("ignored", "foo", "bar")
                .byPage("page2")
                .flatMapIterable(page -> page.getValue())
                .map(Pet::getId)
                .collectList()
                .block(Duration.ofSeconds(10)));
    }

    @Test
    public void testInitialContinuationToken() {
        ServerDrivenPaginationContinuationTokenClient client
            = builder.buildServerDrivenPaginationContinuationTokenClient();
        List<PagedIterable<Pet>> results = List.of(client.requestQueryResponseBody("page2", "foo", "bar"),
            client.requestHeaderResponseBody("page2", "foo", "bar"),
            client.requestQueryResponseHeader("page2", "foo", "bar"),
            client.requestHeaderResponseHeader("page2", "foo", "bar"),
            client.requestQueryNestedResponseBody("page2", "foo", "bar"),
            client.requestHeaderNestedResponseBody("page2", "foo", "bar"));
        for (PagedIterable<Pet> result : results) {
            assertPetIds(result, "3", "4");
            assertPetIds(result, "3", "4");
        }
        ServerDrivenPaginationContinuationTokenAsyncClient asyncClient
            = builder.buildServerDrivenPaginationContinuationTokenAsyncClient();
        List<Flux<Pet>> asyncResults = List.of(asyncClient.requestQueryResponseBody("page2", "foo", "bar"),
            asyncClient.requestHeaderResponseBody("page2", "foo", "bar"),
            asyncClient.requestQueryResponseHeader("page2", "foo", "bar"),
            asyncClient.requestHeaderResponseHeader("page2", "foo", "bar"),
            asyncClient.requestQueryNestedResponseBody("page2", "foo", "bar"),
            asyncClient.requestHeaderNestedResponseBody("page2", "foo", "bar"));
        for (Flux<Pet> result : asyncResults) {
            Assertions.assertEquals(List.of("3", "4"),
                result.map(Pet::getId).collectList().block(Duration.ofSeconds(10)));
        }
        Assertions.assertEquals(List.of("3", "4"),
            builder.buildXmlPaginationClient()
                .listWithContinuation("page2")
                .stream()
                .map(XmlPet::getId)
                .collect(Collectors.toList()));
    }

    @Test
    public void testProtocolContinuationTokenPreservesOptions() {
        RequestOptions options = new RequestOptions().addHeader("foo", "foo").addQueryParam("bar", "bar");
        ServerDrivenPaginationContinuationTokenClient client
            = builder.buildServerDrivenPaginationContinuationTokenClient();
        for (int i = 0; i < 2; i++) {
            Assertions.assertEquals(4, client.requestQueryResponseBody(options).stream().count());
            Assertions.assertEquals(4, client.requestHeaderResponseHeader(options).stream().count());
        }
    }

    @Test
    public void testXmlContinuationToken() {
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            builder.buildXmlPaginationClient()
                .listWithContinuation()
                .stream()
                .map(XmlPet::getId)
                .collect(Collectors.toList()));
        Assertions.assertEquals(List.of("3", "4"),
            builder.buildXmlPaginationAsyncClient()
                .listWithContinuation()
                .byPage("page2")
                .flatMapIterable(page -> page.getValue())
                .map(XmlPet::getId)
                .collectList()
                .block(Duration.ofSeconds(10)));
    }

    private static void assertPetIds(PagedIterable<Pet> pagedIterable) {
        assertPetIds(pagedIterable, "1", "2", "3", "4");
    }

    private static void assertPetIds(PagedIterable<Pet> pagedIterable, String... expectedIds) {
        Assertions.assertEquals(List.of(expectedIds),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }
}
