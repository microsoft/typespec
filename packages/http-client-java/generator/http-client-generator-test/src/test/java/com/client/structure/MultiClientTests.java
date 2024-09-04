// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.client.structure;

import com.client.structure.service.ClientAClient;
import com.client.structure.service.ClientAClientBuilder;
import com.client.structure.service.ClientBClient;
import com.client.structure.service.ClientBClientBuilder;
import org.junit.jupiter.api.Test;

public class MultiClientTests {

    private final ClientAClient client1 = new ClientAClientBuilder()
            .endpoint("http://localhost:3000")
            .client("multi-client").buildClient();
    private final ClientBClient client2 = new ClientBClientBuilder()
            .endpoint("http://localhost:3000")
            .client("multi-client").buildClient();

    @Test
    public void testClient() {
        client1.renamedOne();
        client1.renamedThree();
        client1.renamedFive();

        client2.renamedTwo();
        client2.renamedFour();
        client2.renamedSix();
    }
}
