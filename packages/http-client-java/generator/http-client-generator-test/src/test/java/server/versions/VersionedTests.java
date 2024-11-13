// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package server.versions;

import org.junit.jupiter.api.Test;
import server.versions.versioned.VersionedClient;
import server.versions.versioned.VersionedClientBuilder;
import server.versions.versioned.VersionedServiceVersion;

public class VersionedTests {

    private final VersionedClient client = new VersionedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(VersionedServiceVersion.V2022_12_01_PREVIEW)
        .buildClient();

    @Test
    public void test() {
        client.withoutApiVersion();

        client.withPathApiVersion();

        client.withQueryApiVersion();

        VersionedClient oldClient = new VersionedClientBuilder().endpoint("http://localhost:3000")
            .serviceVersion(VersionedServiceVersion.V2021_01_01_PREVIEW)
            .buildClient();
        oldClient.withQueryOldApiVersion();
    }
}
