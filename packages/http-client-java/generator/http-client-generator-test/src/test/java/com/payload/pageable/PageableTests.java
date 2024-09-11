// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.payload.pageable;

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.rest.PagedIterable;
import com.payload.pageable.models.User;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashSet;

public class PageableTests {

    private final PageableClient client = new PageableClientBuilder()
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS).setAllowedQueryParamNames(new HashSet<>(Arrays.asList("maxpagesize", "skipToken"))))
            .buildClient();

    @Test
    public void testPageable() {
        PagedIterable<User> pagedIterable = client.list();
        Assertions.assertEquals(4, pagedIterable.streamByPage(3).mapToInt(p -> p.getValue().size()).sum());
    }
}
