// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class NeverClientTest {

    private final NeverClient client = new ValueTypesClientBuilder().buildNeverClient();

    @Test
    public void get() {
        NeverProperty response = client.get();
        Assertions.assertNotNull(response);
    }

    @Test
    public void put() {
        client.put(new NeverProperty());
    }
}
