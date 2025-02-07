// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import io.clientcore.core.http.models.PagedIterable;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PageableTests {

    private final PageableClient client = new PageableClientBuilder().buildPageableClient();

    @Test
    public void test() {
        PagedIterable<Pet> pagedIterable = client.link();

        Assertions.assertEquals(4, pagedIterable.stream().count());
    }
}
