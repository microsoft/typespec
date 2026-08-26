// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientlocation;

import azure.clientgenerator.core.clientlocation.subclient.AdminOperationsClient;
import azure.clientgenerator.core.clientlocation.subclient.MoveToExistingSubClientBuilder;
import azure.clientgenerator.core.clientlocation.subclient.UserOperationsClient;
import org.junit.jupiter.api.Test;

public class SubClientTests {

    private final MoveToExistingSubClientBuilder builder = new MoveToExistingSubClientBuilder();

    @Test
    public void testAdminOperations() {
        AdminOperationsClient adminClient = builder.buildAdminOperationsClient();
        adminClient.getAdminInfo();
        adminClient.deleteUser();
    }

    @Test
    public void testUserOperations() {
        UserOperationsClient userClient = builder.buildUserOperationsClient();
        userClient.getUser();
    }
}
