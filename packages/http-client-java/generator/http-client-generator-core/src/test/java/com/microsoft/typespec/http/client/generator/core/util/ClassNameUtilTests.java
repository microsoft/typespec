// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClassNameUtilTests {

    @Test
    public void testTruncateClassName() {
        // limit class name
        String name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.deviceprovisioningservices",
            "src/samples/java", "com.azure.resourcemanager.deviceprovisioningservices.generated",
            "IotDpsResourceCheckProvisioningServiceNameAvailabilitySamples");
        Assertions.assertEquals(
            // workaround spelling check
            "IotDpsResourceCheckProvisioningServiceNameAvailabilitySamples".substring(0, 53), name);

        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.recoveryservicessiterecovery",
            "src/tests/java", "com.azure.resourcemanager.recoveryservicessiterecovery.generated",
            "InMageRcmUpdateApplianceForReplicationProtectedItemInputTests");
        Assertions.assertEquals(
            // workaround spelling check
            "InMageRcmUpdateApplianceForReplicationProtectedItemInputTests".substring(0, 49), name);

        // do nothing as too little remaining length for class name
        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.deviceprovisioningservicespadpadpadpadpadpad",
            "src/samples/java", "com.azure.resourcemanager.deviceprovisioningservicespadpadpadpadpadpad.generated",
            "IotDpsResourceCheckProvisioningServiceNameAvailabilitySamples");
        Assertions.assertEquals("IotDpsResourceCheckProvisioningServiceNameAvailabilitySamples", name);

        // no change
        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.datafactory", "src/samples/java",
            "com.azure.resourcemanager.datafactory.generated", "DataFlowDebugSessionAddDataFlowSamples");
        Assertions.assertEquals("DataFlowDebugSessionAddDataFlowSamples", name);
    }
}
