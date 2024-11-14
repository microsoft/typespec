// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.returntypechangedfrom;

import com.versioning.returntypechangedfrom.models.Versions;
import org.junit.jupiter.api.Test;

public class ReturnTypeChangedFromClientTests {
    private final ReturnTypeChangedFromClient returnTypeChangedFromClient
        = new ReturnTypeChangedFromClientBuilder().endpoint("http://localhost:3000").version(Versions.V2).buildClient();

    @Test
    public void testReturnTypeChangedFromClient() {
        returnTypeChangedFromClient.test("test");
    }
}
