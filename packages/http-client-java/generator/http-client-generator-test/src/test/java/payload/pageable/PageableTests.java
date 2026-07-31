// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import com.azure.core.http.rest.PagedIterable;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import payload.pageable.models.Pet;

public class PageableTests {

    private final PageableClientBuilder builder = new PageableClientBuilder();

    @Test
    public void testNestedLink() {
        PagedIterable<Pet> pagedIterable = builder.buildServerDrivenPaginationClient().nestedLink();

        Assertions.assertEquals(List.of("1", "2", "3", "4"),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }
}
