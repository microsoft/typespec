// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import io.clientcore.core.http.models.PagedIterable;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PageableTests {

    private final ServerDrivenPaginationClient client = new PageableClientBuilder().buildServerDrivenPaginationClient();

    @Test
    public void testNextLink() {
        PagedIterable<Pet> pagedIterable = client.link();

        Assertions.assertEquals(4, pagedIterable.stream().count());
    }
}
