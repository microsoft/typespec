// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.server.endpoint.notdefined;

import org.junit.jupiter.api.Test;

public class EndpointTests {

    @Test
    public void testEndpoint() {
        new NotDefinedClientBuilder()
                .endpoint("http://localhost:3000")
                .buildClient()
                .valid();
    }
}
