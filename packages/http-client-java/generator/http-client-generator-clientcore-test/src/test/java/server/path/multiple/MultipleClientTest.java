// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package server.path.multiple;

import org.junit.jupiter.api.Test;

public class MultipleClientTest {

    private final MultipleClient client = new MultipleClientBuilder().endpoint("http://localhost:3000").buildClient();

    @Test
    public void noOperationParams() {
        client.noOperationParams();
    }

    @Test
    public void withOperationPathParam() {
        client.withOperationPathParam("test");
    }
}
