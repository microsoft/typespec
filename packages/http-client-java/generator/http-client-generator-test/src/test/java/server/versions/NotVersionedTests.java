// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package server.versions;

import org.junit.jupiter.api.Test;
import server.versions.notversioned.NotVersionedClient;
import server.versions.notversioned.NotVersionedClientBuilder;

public class NotVersionedTests {

    private final NotVersionedClient client
        = new NotVersionedClientBuilder().endpoint("http://localhost:3000").buildClient();

    @Test
    public void test() {
        client.withoutApiVersion();

        client.withPathApiVersion("v1.0");

        client.withQueryApiVersion("v1.0");
    }
}
