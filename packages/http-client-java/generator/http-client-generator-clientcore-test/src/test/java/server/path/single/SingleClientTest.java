// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package server.path.single;

import org.junit.jupiter.api.Test;

public class SingleClientTest {

    private final SingleClient client = new SingleClientBuilder().endpoint("http://localhost:3000").buildClient();

    @Test
    public void myOp() {
        client.myOp();
    }
}
