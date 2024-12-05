// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.specialheaders.xmsclientrequestid;

import org.junit.jupiter.api.Test;

public class XmsClientRequestIdTests {

    private final XmsClientRequestIdClient client
        = new XmsClientRequestIdClientBuilder().endpoint("http://localhost:3001").buildClient();

    @Test
    public void testRequestId() {
        client.get();
    }
}
