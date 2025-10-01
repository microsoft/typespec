// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.movemethodparametertoclient.models.Blob;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class ClientLocationClientTests {

    private final ClientLocationClientBuilder builder = new ClientLocationClientBuilder().storageAccount("testaccount");

    @Test
    public void testMoveToExistingSubClient() {
        MoveToExistingSubUserOperationsClient userClient = builder.buildMoveToExistingSubUserOperationsClient();
        userClient.getUser();

        MoveToExistingSubAdminOperationsClient adminClient = builder.buildMoveToExistingSubAdminOperationsClient();
        // deleteUser moved to MoveToExistingSubAdminOperationsClient
        adminClient.deleteUser();
        adminClient.getAdminInfo();
    }

    @Test
    public void testMoveToNewSubClient() {
        MoveToNewSubProductOperationsClient productClient = builder.buildMoveToNewSubProductOperationsClient();
        productClient.listProducts();

        ArchiveOperationsClient archiveClient = builder.buildArchiveOperationsClient();
        // archiveProduct moved to ArchiveOperationsClient
        archiveClient.archiveProduct();
    }

    @Test
    public void testMoveToRootClient() {
        MoveToRootResourceOperationsClient resourceClient = builder.buildMoveToRootResourceOperationsClient();
        resourceClient.getResource();

        ClientLocationClient rootClient = builder.buildClient();
        // getHealthStatus moved to root client
        rootClient.getHealthStatus();
    }

    @Test
    public void testMoveMethodParameterToClient() {
        MoveMethodParameterToBlobOperationsClient blobClient = builder.buildMoveMethodParameterToBlobOperationsClient();

        // Test the scenario: GET /blob?storageAccount=testaccount&container=testcontainer&blob=testblob.txt
        // Expected response: {"id": "blob-001", "name": "testblob.txt", "size": 1024, "path":
        // "/testcontainer/testblob.txt"}
        // "testaccount" moved to client
        Blob blob = blobClient.getBlob("testcontainer", "testblob.txt");

        // Verify the Blob model structure
        Assertions.assertNotNull(blob);
        Assertions.assertNotNull(blob.getId());
        Assertions.assertNotNull(blob.getName());
        Assertions.assertTrue(blob.getSize() > 0);
        Assertions.assertNotNull(blob.getPath());
    }
}
