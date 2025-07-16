// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import org.junit.jupiter.api.Test;

public final class ClientLocationClientTests {

    @Test
    public void testMoveToExistingSubClient() {
        MoveToExistingSubUserOperationsClient userClient
            = new ClientLocationClientBuilder().buildMoveToExistingSubUserOperationsClient();
        userClient.getUser();

        MoveToExistingSubAdminOperationsClient adminClient
            = new ClientLocationClientBuilder().buildMoveToExistingSubAdminOperationsClient();
        // deleteUser moved to MoveToExistingSubAdminOperationsClient
        adminClient.deleteUser();
        adminClient.getAdminInfo();
    }

    @Test
    public void testMoveToNewSubClient() {
        MoveToNewSubProductOperationsClient productClient
            = new ClientLocationClientBuilder().buildMoveToNewSubProductOperationsClient();
        productClient.listProducts();

        ArchiveOperationsClient archiveClient = new ClientLocationClientBuilder().buildArchiveOperationsClient();
        // archiveProduct moved to ArchiveOperationsClient
        archiveClient.archiveProduct();
    }

    @Test
    public void testMoveToRootClient() {
        MoveToRootResourceOperationsClient resourceClient
            = new ClientLocationClientBuilder().buildMoveToRootResourceOperationsClient();
        resourceClient.getResource();

        ClientLocationClient rootClient = new ClientLocationClientBuilder().buildClient();
        // getHealthStatus moved to root client
        rootClient.getHealthStatus();
    }
}
