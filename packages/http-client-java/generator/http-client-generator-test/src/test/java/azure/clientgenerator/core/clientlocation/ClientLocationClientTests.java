// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.movemethodparametertoclient.models.Blob;
import org.junit.jupiter.api.Assertions;
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

    @Test
    public void testMoveMethodParameterToClient() {
        MoveMethodParameterToBlobOperationsClient blobClient
            = new ClientLocationClientBuilder().buildMoveMethodParameterToBlobOperationsClient();

        // Test the scenario: GET /blob?storageAccount=testaccount&container=testcontainer&blob=testblob.txt
        // Expected response: {"id": "blob-001", "name": "testblob.txt", "size": 1024, "path":
        // "/testcontainer/testblob.txt"}
        Blob blob = blobClient.getBlob("testaccount", "testcontainer", "testblob.txt");

        // Verify the Blob model structure
        Assertions.assertNotNull(blob);
        Assertions.assertNotNull(blob.getId());
        Assertions.assertNotNull(blob.getName());
        Assertions.assertTrue(blob.getSize() > 0);
        Assertions.assertNotNull(blob.getPath());
    }
}
