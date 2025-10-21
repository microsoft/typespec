// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagingOptions;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PageableTests {

    private final PageableClient pageableClient = new PageableClientBuilder().buildClient();
    private final ServerDrivenPaginationClient client = new PageableClientBuilder().buildServerDrivenPaginationClient();
    private final ServerDrivenPaginationContinuationTokenClient tokenClient
        = new PageableClientBuilder().buildServerDrivenPaginationContinuationTokenClient();

    @Test
    public void testNextLink() {
        PagedIterable<Pet> pagedIterable = client.link();

        Assertions.assertEquals(4, pagedIterable.stream().count());
    }

    @Test
    public void testContinuationToken() {
        PagedIterable<Pet> pagedIterable = tokenClient.requestHeaderResponseBody("foo", "bar");
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestHeaderResponseHeader("foo", "bar");
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestQueryResponseBody("foo", "bar");
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestQueryResponseHeader("foo", "bar");
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));

        // query 2nd page
        pagedIterable = tokenClient.requestQueryResponseHeader("foo", "bar");
        Assertions.assertEquals(List.of("3", "4"),
            pagedIterable.streamByPage(new PagingOptions().setContinuationToken("page2"))
                .flatMap(page -> page.getValue().stream())
                .map(Pet::getId)
                .collect(Collectors.toList()));

        // expect throws if input unsupported PagingOptions param
        Assertions.assertThrows(IllegalArgumentException.class,
            () -> tokenClient.requestQueryResponseHeader("foo", "bar")
                .streamByPage(new PagingOptions().setPageSize(4L))
                .count());
    }

    @Test
    public void testNestedLink() {
        PagedIterable<Pet> pagedIterable = client.nestedLink();

        Assertions.assertEquals(4, pagedIterable.stream().count());
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }

    @Test
    public void testNestedContinuationToken() {
        PagedIterable<Pet> pagedIterable = tokenClient.requestQueryNestedResponseBody("foo", "bar");
        Assertions.assertEquals(4, pagedIterable.stream().count());
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));

        pagedIterable = tokenClient.requestHeaderNestedResponseBody("foo", "bar");
        Assertions.assertEquals(4, pagedIterable.stream().count());
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));

        // query 2nd page with continuation token
        pagedIterable = tokenClient.requestQueryNestedResponseBody("foo", "bar");
        Assertions.assertEquals(List.of("3", "4"),
            pagedIterable.streamByPage(new PagingOptions().setContinuationToken("page2"))
                .flatMap(page -> page.getValue().stream())
                .map(Pet::getId)
                .collect(Collectors.toList()));
    }

    @Test
    public void testListWithoutContinuation() {
        PagedIterable<Pet> pagedIterable = pageableClient.listWithoutContinuation();

        Assertions.assertEquals(4, pagedIterable.stream().count());
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }

    @Test
    public void testLinkString() {
        PagedIterable<Pet> pagedIterable = client.linkString();

        Assertions.assertEquals(4, pagedIterable.stream().count());
        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }
}
