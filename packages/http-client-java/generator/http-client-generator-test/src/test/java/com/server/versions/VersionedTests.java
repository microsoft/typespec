// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.server.versions;

import com.server.versions.versioned.VersionedClient;
import com.server.versions.versioned.VersionedClientBuilder;
import com.server.versions.versioned.VersionedServiceVersion;
import org.junit.jupiter.api.Test;

public class VersionedTests {

    private final VersionedClient client = new VersionedClientBuilder()
            .endpoint("http://localhost:3000")
            .serviceVersion(VersionedServiceVersion.V2022_12_01_PREVIEW)
            .buildClient();

    @Test
    public void test() {
        client.withoutApiVersion();

        client.withPathApiVersion();

        client.withQueryApiVersion();

        VersionedClient oldClient = new VersionedClientBuilder()
                .endpoint("http://localhost:3000")
                .serviceVersion(VersionedServiceVersion.V2021_01_01_PREVIEW)
                .buildClient();
        oldClient.withQueryOldApiVersion();
    }
}
