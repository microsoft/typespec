// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.naming.enumconflict;

import client.naming.enumconflict.firstnamespace.models.FirstModel;
import client.naming.enumconflict.firstnamespace.models.Status;
import client.naming.enumconflict.secondnamespace.models.SecondModel;
import client.naming.enumconflict.secondnamespace.models.SecondStatus;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EnumConflictTests {

    private final FirstOperationsClient firstOperationsClient
        = new EnumConflictClientBuilder().buildFirstOperationsClient();

    private final SecondOperationsClient secondOperationsClient
        = new EnumConflictClientBuilder().buildSecondOperationsClient();

    @Test
    public void testFirstNamespaceStatusEnum() {
        // Test that we can use the Status enum from first namespace
        FirstModel requestModel = new FirstModel(Status.ACTIVE, "test");
        FirstModel responseModel = firstOperationsClient.first(requestModel);

        Assertions.assertNotNull(responseModel);
        Assertions.assertEquals(Status.ACTIVE, responseModel.getStatus());
        Assertions.assertEquals("test", responseModel.getName());
    }

    @Test
    public void testSecondNamespaceStatusEnum() {
        // Test that we can use the SecondStatus enum from second namespace
        // Note: The conflict was resolved by renaming to SecondStatus
        SecondModel requestModel = new SecondModel(SecondStatus.RUNNING, "test description");
        SecondModel responseModel = secondOperationsClient.second(requestModel);

        Assertions.assertNotNull(responseModel);
        Assertions.assertEquals(SecondStatus.RUNNING, responseModel.getStatus());
        Assertions.assertEquals("test description", responseModel.getDescription());
    }
}
