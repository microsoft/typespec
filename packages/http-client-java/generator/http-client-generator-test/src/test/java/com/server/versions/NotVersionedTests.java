// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.server.versions;

import com.server.versions.notversioned.NotVersionedClient;
import com.server.versions.notversioned.NotVersionedClientBuilder;
import org.junit.jupiter.api.Test;

public class NotVersionedTests {

    private final NotVersionedClient client = new NotVersionedClientBuilder()
            .endpoint("http://localhost:3000")
            .buildClient();

    @Test
    public void test() {
        client.withoutApiVersion();

        client.withPathApiVersion("v1.0");

        client.withQueryApiVersion("v1.0");
    }
}
