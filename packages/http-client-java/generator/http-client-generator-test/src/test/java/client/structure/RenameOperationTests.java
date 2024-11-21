// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.structure;

import client.structure.service.GroupClient;
import client.structure.service.RenamedOperationClient;
import client.structure.service.RenamedOperationClientBuilder;
import client.structure.service.models.ClientType;
import org.junit.jupiter.api.Test;

public class RenameOperationTests {

    private final RenamedOperationClient client = new RenamedOperationClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.RENAMED_OPERATION)
        .buildClient();
    private final GroupClient groupClient = new RenamedOperationClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.RENAMED_OPERATION)
        .buildGroupClient();

    @Test
    public void testClient() {
        client.renamedOne();
        client.renamedThree();
        client.renamedFive();

        groupClient.renamedTwo();
        groupClient.renamedFour();
        groupClient.renamedSix();
    }
}
