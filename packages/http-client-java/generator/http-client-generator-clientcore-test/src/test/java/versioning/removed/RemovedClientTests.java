// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.removed;

import io.clientcore.core.models.binarydata.BinaryData;
import org.junit.jupiter.api.Test;

public class RemovedClientTests {

    private final RemovedClient removedClientV1 = new RemovedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(RemovedServiceVersion.V1)
        .buildClient();

    private final RemovedClient removedClientV2 = new RemovedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(RemovedServiceVersion.V2)
        .buildClient();

    private final RemovedClient removedClientV2Preview = new RemovedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(RemovedServiceVersion.V2PREVIEW)
        .buildClient();

    @Test
    public void tesRemovedClient() {
        removedClientV2.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER_V2, BinaryData.fromObject("bar")));
    }

    @Test
    public void tesRemovedClientModelV3() {
        removedClientV1.modelV3(new ModelV3("123", EnumV3.ENUM_MEMBER_V1));

        removedClientV2.modelV3(new ModelV3("123", EnumV3.ENUM_MEMBER_V1));

        // nothing can be done if property is removed from an api-version
        removedClientV2Preview.modelV3(new ModelV3("123", null));
    }
}
