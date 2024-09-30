// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.removed;

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.util.BinaryData;
import com.versioning.removed.models.EnumV2;
import com.versioning.removed.models.EnumV3;
import com.versioning.removed.models.ModelV2;
import com.versioning.removed.models.ModelV3;
import org.junit.jupiter.api.Test;

public class RemovedClientTests {

    private final RemovedClient removedClientV1
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version("v1").buildClient();

    private final RemovedClient removedClientV2
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version("v2").buildClient();

    private final RemovedClient removedClientV2Preview = new RemovedClientBuilder().endpoint("http://localhost:3000")
        .version("v2preview")
        .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS))
        .buildClient();

    @Test
    public void tesRemovedClient() {
        removedClientV2.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER_V2, BinaryData.fromObject("bar")));

        removedClientV1.modelV3(new ModelV3("123", EnumV3.ENUM_MEMBER_V1));
        removedClientV2.modelV3(new ModelV3("123", EnumV3.ENUM_MEMBER_V1));
        // bug
        // removedClientV2Preview.modelV3(new ModelV3("123", EnumV3.ENUM_MEMBER_V2PREVIEW));
    }
}
