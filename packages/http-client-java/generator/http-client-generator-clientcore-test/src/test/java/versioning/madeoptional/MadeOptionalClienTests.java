// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.madeoptional;

import org.junit.jupiter.api.Test;

public class MadeOptionalClienTests {
    private final MadeOptionalClient madeOptionalClient
        = new MadeOptionalClientBuilder().endpoint("http://localhost:3000")
            .serviceVersion(MadeOptionalServiceVersion.V2)
            .buildClient();

    @Test
    public void testMadeOptionalClient() {
        madeOptionalClient.test(new TestModel("foo"));
    }
}
