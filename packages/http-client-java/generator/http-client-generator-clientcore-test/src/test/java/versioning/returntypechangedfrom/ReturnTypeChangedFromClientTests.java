// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.returntypechangedfrom;

import org.junit.jupiter.api.Test;

public class ReturnTypeChangedFromClientTests {
    private final ReturnTypeChangedFromClient returnTypeChangedFromClient
        = new ReturnTypeChangedFromClientBuilder().endpoint("http://localhost:3000")
            .serviceVersion(ReturnTypeChangedFromServiceVersion.V2)
            .buildClient();

    @Test
    public void testReturnTypeChangedFromClient() {
        returnTypeChangedFromClient.test("test");
    }
}
