// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.client.structure;

import com.client.structure.service.Group1Client;
import com.client.structure.service.Group2Client;
import com.client.structure.service.TwoOperationGroupClientBuilder;
import org.junit.jupiter.api.Test;

public class OperationGroupClientTests {

    private final Group1Client client1 = new TwoOperationGroupClientBuilder()
            .endpoint("http://localhost:3000")
            .client("two-operation-group").buildGroup1Client();
    private final Group2Client client2 = new TwoOperationGroupClientBuilder()
            .endpoint("http://localhost:3000")
            .client("two-operation-group").buildGroup2Client();

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
