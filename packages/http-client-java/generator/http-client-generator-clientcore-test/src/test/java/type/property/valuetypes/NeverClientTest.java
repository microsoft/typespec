// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class NeverClientTest {

    NeverClient client = new ValueTypesClientBuilder().buildNeverClient();

    @Test
    void get() {
        NeverProperty response = client.get();
        Assertions.assertNotNull(response);
    }

    @Test
    void put() {
        client.put(new NeverProperty());
    }
}
