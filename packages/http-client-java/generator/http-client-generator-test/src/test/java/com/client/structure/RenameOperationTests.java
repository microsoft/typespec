// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.client.structure;

import com.client.structure.service.GroupClient;
import com.client.structure.service.RenamedOperationClient;
import com.client.structure.service.RenamedOperationClientBuilder;
import org.junit.jupiter.api.Test;

public class RenameOperationTests {

    private final RenamedOperationClient client = new RenamedOperationClientBuilder()
            .endpoint("http://localhost:3000")
            .client("renamed-operation").buildClient();
    private final GroupClient groupClient = new RenamedOperationClientBuilder()
            .endpoint("http://localhost:3000")
            .client("renamed-operation").buildGroupClient();

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
