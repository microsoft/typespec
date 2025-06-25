// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.inheritance;

import org.junit.jupiter.api.Test;
import type.model.inheritance.recursive.RecursiveClient;
import type.model.inheritance.recursive.RecursiveClientBuilder;
import type.model.inheritance.recursive.models.Extension;

public class RecursiveReferenceTests {

    private final RecursiveClient client = new RecursiveClientBuilder().buildClient();

    @Test
    public void test() {
        Extension extension = client.get();
        client.put(extension);
    }
}
