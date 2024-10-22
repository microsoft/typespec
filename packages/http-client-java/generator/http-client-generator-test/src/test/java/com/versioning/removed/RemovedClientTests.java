// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.removed;

import com.azure.core.util.BinaryData;
import com.versioning.removed.models.EnumV2;
import com.versioning.removed.models.ModelV2;
import org.junit.jupiter.api.Test;

public class RemovedClientTests {

    private final RemovedClient removedClientV1
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version("v1").buildClient();

    private final RemovedClient removedClientV2
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version("v2").buildClient();

    @Test
    public void tesRemovedClient() {
        removedClientV2.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER_V2, BinaryData.fromObject("bar")));
    }
}
