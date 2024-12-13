// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.structure;

import client.structure.service.models.ClientType;
import client.structure.twooperationgroup.Group1Client;
import client.structure.twooperationgroup.Group2Client;
import client.structure.twooperationgroup.TwoOperationGroupClientBuilder;
import org.junit.jupiter.api.Test;

public class OperationGroupClientTests {

    private final Group1Client client1 = new TwoOperationGroupClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.TWO_OPERATION_GROUP)
        .buildGroup1Client();
    private final Group2Client client2 = new TwoOperationGroupClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.TWO_OPERATION_GROUP)
        .buildGroup2Client();

    @Test
    public void testClient() {
        client1.one();
        client1.three();
        client1.four();

        client2.two();
        client2.five();
        client2.six();
    }
}
