// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.parameter.MoveMethodParameterToClient;
import azure.clientgenerator.core.clientlocation.parameter.MoveMethodParameterToClientBuilder;
import azure.clientgenerator.core.clientlocation.parameter.models.Blob;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ParameterTests {

    private final MoveMethodParameterToClient client
        = new MoveMethodParameterToClientBuilder().storageAccount("testaccount").buildClient();

    @Test
    public void testGetBlob() {
        Blob blob = client.getBlob("testcontainer", "testblob.txt");
        Assertions.assertNotNull(blob);
        Assertions.assertEquals("blob-001", blob.getId());
        Assertions.assertEquals("testblob.txt", blob.getName());
        Assertions.assertEquals(1024, blob.getSize());
        Assertions.assertEquals("/testcontainer/testblob.txt", blob.getPath());
    }
}
