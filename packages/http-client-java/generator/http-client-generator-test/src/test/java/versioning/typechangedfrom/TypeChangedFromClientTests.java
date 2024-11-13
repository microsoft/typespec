// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.typechangedfrom;

import org.junit.jupiter.api.Test;
import versioning.typechangedfrom.models.TestModel;

public class TypeChangedFromClientTests {
    private final TypeChangedFromClient typeChangedFromClient
        = new TypeChangedFromClientBuilder().endpoint("http://localhost:3000").version("v2").buildClient();

    @Test
    public void testTypeChangedFromClient() {
        typeChangedFromClient.test("baz", new TestModel("foo", "bar"));
    }
}
