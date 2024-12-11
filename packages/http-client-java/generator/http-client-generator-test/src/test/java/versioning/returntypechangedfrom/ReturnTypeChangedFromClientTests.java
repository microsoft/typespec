// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.returntypechangedfrom;

import org.junit.jupiter.api.Test;
import versioning.returntypechangedfrom.models.Versions;

public class ReturnTypeChangedFromClientTests {
    private final ReturnTypeChangedFromClient returnTypeChangedFromClient
        = new ReturnTypeChangedFromClientBuilder().endpoint("http://localhost:3000").version(Versions.V2).buildClient();

    @Test
    public void testReturnTypeChangedFromClient() {
        returnTypeChangedFromClient.test("test");
    }
}
