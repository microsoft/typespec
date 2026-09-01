// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientdoc;

import azure.clientgenerator.core.clientdoc.documentation.models.Plant;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClientDocTests {

    private final ClientDocClient client = new ClientDocClientBuilder().buildClient();

    @Test
    public void testHarvest() {
        Plant response = client.harvest(new Plant("Rose", "Rosa"));
        Assertions.assertEquals("Rose", response.getName());
        Assertions.assertEquals("Rosa", response.getSpecies());
    }
}
