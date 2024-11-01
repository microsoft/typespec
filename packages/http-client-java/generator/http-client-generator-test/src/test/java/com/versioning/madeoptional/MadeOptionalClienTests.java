// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.madeoptional;

import com.versioning.madeoptional.models.TestModel;
import com.versioning.madeoptional.models.Versions;
import org.junit.jupiter.api.Test;

public class MadeOptionalClienTests {
    private final MadeOptionalClient madeOptionalClient
        = new MadeOptionalClientBuilder().endpoint("http://localhost:3000").version(Versions.V2).buildClient();

    @Test
    public void testMadeOptionalClient() {
        madeOptionalClient.test(new TestModel("foo"));
    }
}
