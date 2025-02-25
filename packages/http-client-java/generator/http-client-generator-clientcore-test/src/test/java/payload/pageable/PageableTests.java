// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import io.clientcore.core.http.models.PagedIterable;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PageableTests {

    private final ServerDrivenPaginationClient client = new PageableClientBuilder().buildServerDrivenPaginationClient();
    private final ServerDrivenPaginationContinuationTokenClient tokenClient = new PageableClientBuilder().buildServerDrivenPaginationContinuationTokenClient();

    @Test
    public void testNextLink() {
        PagedIterable<Pet> pagedIterable = client.link();

        Assertions.assertEquals(4, pagedIterable.stream().count());
    }

    @Test
    public void testContinuationToken() {
        PagedIterable<Pet> pagedIterable = tokenClient.requestHeaderResponseBody();
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestHeaderResponseHeader();
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestQueryResponseBody();
        Assertions.assertEquals(4, pagedIterable.stream().count());

        pagedIterable = tokenClient.requestQueryResponseHeader();
        Assertions.assertEquals(4, pagedIterable.stream().count());
    }
}
