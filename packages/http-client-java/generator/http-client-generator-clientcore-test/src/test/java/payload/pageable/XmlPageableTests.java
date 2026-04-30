// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.pageable;

import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagingOptions;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class XmlPageableTests {
    private final XmlPaginationClient xmlPaginationClient = new PageableClientBuilder().buildXmlPaginationClient();

    @Test
    public void testListWithContinuation() {
        PagedIterable<XmlPet> pagedIterable = xmlPaginationClient.listWithContinuation();
        Assertions.assertTrue(pagedIterable.stream().count() > 0, "Should return at least one XmlPet");
    }

    @Test
    public void testListWithNextLink() {
        PagedIterable<XmlPet> pagedIterable = xmlPaginationClient.listWithNextLink();
        Assertions.assertTrue(pagedIterable.stream().count() > 0, "Should return at least one XmlPet");
    }

    @Test
    public void testListWithContinuationByPage() {
        PagedIterable<XmlPet> pagedIterable = xmlPaginationClient.listWithContinuation();
        List<String> ids = pagedIterable.streamByPage(new PagingOptions().setContinuationToken("page2"))
            .flatMap(page -> page.getValue().stream())
            .map(XmlPet::getId)
            .collect(Collectors.toList());
        Assertions.assertNotNull(ids, "Ids should not be null");
    }

    @Test
    public void testListWithNextLinkByPage() {
        PagedIterable<XmlPet> pagedIterable = xmlPaginationClient.listWithNextLink();
        List<String> names = pagedIterable.streamByPage()
            .flatMap(page -> page.getValue().stream())
            .map(XmlPet::getName)
            .collect(Collectors.toList());
        Assertions.assertNotNull(names, "Names should not be null");
    }
}
