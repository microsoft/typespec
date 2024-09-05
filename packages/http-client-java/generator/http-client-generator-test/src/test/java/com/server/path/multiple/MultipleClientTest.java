// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.server.path.multiple;

import org.junit.jupiter.api.Test;

class MultipleClientTest {

    MultipleClient client = new MultipleClientBuilder().endpoint("http://localhost:3000").buildClient();

    @Test
    void noOperationParams() {
        client.noOperationParams();
    }

    @Test
    void withOperationPathParam() {
        client.withOperationPathParam("test");
    }
}