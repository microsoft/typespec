// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.removed;

import io.clientcore.core.util.binarydata.BinaryData;
import org.junit.jupiter.api.Test;

public class RemovedClientTests {

    private final RemovedClient removedClientV1
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version(Versions.V1).buildClient();

    private final RemovedClient removedClientV2
        = new RemovedClientBuilder().endpoint("http://localhost:3000").version(Versions.V2).buildClient();

    @Test
    public void tesRemovedClient() {
        removedClientV2.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER_V2, BinaryData.fromObject("bar")));
    }
}
