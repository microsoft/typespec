// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import com.azure.core.http.rest.PagedIterable;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import payload.pageable.models.Pet;
import payload.pageable.models.XmlPet;
import payload.pageable.serverdrivenpagination.alternateinitialverb.models.Filter;

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

    /*
     * Continuation-token scenarios are intentionally not covered here. Azure V1 currently emits a single-page
     * PagedIterable for them because it does not propagate a response continuation token into the next request.
     *
     * XML continuation-token paging is also intentionally not covered because it has the same token propagation
     * limitation.
     */

    private static void assertPetIds(PagedIterable<Pet> pagedIterable) {
        assertPetIds(pagedIterable, "1", "2", "3", "4");
    }

    private static void assertPetIds(PagedIterable<Pet> pagedIterable, String... expectedIds) {
        Assertions.assertEquals(List.of(expectedIds),
            pagedIterable.stream().map(Pet::getId).collect(Collectors.toList()));
    }
}
