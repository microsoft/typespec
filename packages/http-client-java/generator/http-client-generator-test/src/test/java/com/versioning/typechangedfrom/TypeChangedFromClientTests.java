// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.typechangedfrom;

import com.versioning.typechangedfrom.models.TestModel;
import org.junit.jupiter.api.Test;

public class TypeChangedFromClientTests {
    private final TypeChangedFromClient typeChangedFromClient = new TypeChangedFromClientBuilder()
            .endpoint("http://localhost:3000").version("v2").buildClient();

    @Test
    public void testTypeChangedFromClient() {
        typeChangedFromClient.test("baz", new TestModel("foo", "bar"));
    }
}
