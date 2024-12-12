// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.structure;

import client.structure.multiclient.ClientAClient;
import client.structure.multiclient.ClientAClientBuilder;
import client.structure.multiclient.ClientBClient;
import client.structure.multiclient.ClientBClientBuilder;
import client.structure.service.models.ClientType;
import org.junit.jupiter.api.Test;

public class MultiClientTests {

    private final ClientAClient client1
        = new ClientAClientBuilder().endpoint("http://localhost:3000").client(ClientType.MULTI_CLIENT).buildClient();
    private final ClientBClient client2
        = new ClientBClientBuilder().endpoint("http://localhost:3000").client(ClientType.MULTI_CLIENT).buildClient();

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
