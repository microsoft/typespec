// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.specialheaders.xmsclientrequestid;

import com.azure.specialheaders.xmsclientrequestid.XmsClientRequestIdClient;
import com.azure.specialheaders.xmsclientrequestid.XmsClientRequestIdClientBuilder;
import org.junit.jupiter.api.Test;

public class XmsClientRequestIdTests {

    private final XmsClientRequestIdClient client = new XmsClientRequestIdClientBuilder().buildClient();

    @Test
    public void testRequestId() {
        client.get();
    }
}
