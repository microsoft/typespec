// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.newsubclient.ArchiveOperationsClient;
import azure.clientgenerator.core.clientlocation.newsubclient.MoveToNewSubClientBuilder;
import azure.clientgenerator.core.clientlocation.newsubclient.ProductOperationsClient;
import org.junit.jupiter.api.Test;

public class NewSubClientTests {

    private final MoveToNewSubClientBuilder builder = new MoveToNewSubClientBuilder();

    @Test
    public void testProductOperations() {
        ProductOperationsClient productClient = builder.buildProductOperationsClient();
        productClient.listProducts();
    }

    @Test
    public void testArchiveOperations() {
        ArchiveOperationsClient archiveClient = builder.buildArchiveOperationsClient();
        archiveClient.archiveProduct();
    }
}
