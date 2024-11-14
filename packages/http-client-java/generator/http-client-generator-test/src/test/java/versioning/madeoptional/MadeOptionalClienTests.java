// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.madeoptional;

import org.junit.jupiter.api.Test;
import versioning.madeoptional.models.TestModel;

public class MadeOptionalClienTests {
    private final MadeOptionalClient madeOptionalClient
        = new MadeOptionalClientBuilder().endpoint("http://localhost:3000").version("v2").buildClient();

    @Test
    public void testMadeOptionalClient() {
        madeOptionalClient.test(new TestModel("foo"));
    }
}
