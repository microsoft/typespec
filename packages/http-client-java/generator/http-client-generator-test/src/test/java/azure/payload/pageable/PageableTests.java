// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.payload.pageable;

import azure.payload.pageable.models.User;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.PagedResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PageableTests {

    private final PageableClientBuilder builder = new PageableClientBuilder()
        .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS)
            .setAllowedQueryParamNames(new HashSet<>(Arrays.asList("maxpagesize", "skipToken"))));

    @Test
    public void testPageable() {
        PagedIterable<User> pagedIterable = builder.buildClient().list();
        Assertions.assertEquals(4, pagedIterable.streamByPage(3).mapToInt(p -> p.getValue().size()).sum());
    }

    @Test
    public void testPageableAsync() {
        List<PagedResponse<User>> pages
            = builder.buildAsyncClient().list().byPage(3).collectList().block(Duration.ofSeconds(10));

        Assertions.assertNotNull(pages);
        Assertions.assertEquals(2, pages.size());
        Assertions.assertEquals(List.of(3, 1),
            pages.stream().map(page -> page.getValue().size()).collect(Collectors.toList()));
        Assertions.assertEquals(List.of("user5", "user6", "user7", "user8"),
            pages.stream().flatMap(page -> page.getValue().stream()).map(User::getName).collect(Collectors.toList()));
    }
}
