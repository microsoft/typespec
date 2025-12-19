// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.arm;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import tsptest.armresourceprovider.ArmResourceProviderManager;
import tsptest.armresourceprovider.models.ActionFinalResult;

public class LroResponseTests {

    // compile pass
    public void testLroActionFinalResponse() {
        ArmResourceProviderManager manager = Mockito.mock(ArmResourceProviderManager.class);
        ActionFinalResult actionFinalResult = manager.lroNoBodies().action("resourceGroup", "name");
    }

    @Test
    public void testLroActionInitiateResponseNotGenerated() throws ClassNotFoundException {
        // ActionFinalResult generated
        this.getClass().getClassLoader().loadClass("tsptest.armresourceprovider.models.ActionFinalResult");
        // ActionInitiateResult not generated
        Assertions.assertThrows(ClassNotFoundException.class, () -> {
            this.getClass().getClassLoader().loadClass("tsptest.armresourceprovider.models.ActionInitiateResult");
        });
    }
}
