// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.rootclient.MoveToRootClient;
import azure.clientgenerator.core.clientlocation.rootclient.MoveToRootClientBuilder;
import azure.clientgenerator.core.clientlocation.rootclient.ResourceOperationsClient;
import org.junit.jupiter.api.Test;

public class RootClientTests {

    private final MoveToRootClientBuilder builder = new MoveToRootClientBuilder();

    @Test
    public void testRootClient() {
        MoveToRootClient rootClient = builder.buildClient();
        rootClient.getHealthStatus();
    }

    @Test
    public void testResourceOperations() {
        ResourceOperationsClient resourceClient = builder.buildResourceOperationsClient();
        resourceClient.getResource();
    }
}
