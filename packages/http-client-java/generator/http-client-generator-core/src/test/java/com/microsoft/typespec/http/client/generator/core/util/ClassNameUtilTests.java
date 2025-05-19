// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClassNameUtilTests {

    @Test
    public void testTruncateClassName() {
        final int maxFileLength = 260 - 38;

        // limit class name
        String name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.deviceprovisioningservices",
            "src/samples/java", "com.azure.resourcemanager.deviceprovisioningservices.generated",
            "IotDpsResourceCheckProvisioningServiceNameAvailability", "Samples");
        Assertions.assertEquals(maxFileLength, ("sdk/deviceprovisioningservices/azure-resourcemanager-deviceprovisioningservices/src/samples/java/com/azure/resourcemanager/deviceprovisioningservices/generated/" + name + ".java").length());

        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.recoveryservicessiterecovery",
            "src/test/java", "com.azure.resourcemanager.recoveryservicessiterecovery.generated",
            "InMageRcmUpdateApplianceForReplicationProtectedItemInput", "Tests");
        Assertions.assertEquals(maxFileLength, ("sdk/recoveryservicessiterecovery/azure-resourcemanager-recoveryservicessiterecovery/src/test/java/com/azure/resourcemanager/recoveryservicessiterecovery/generated/" + name + ".java").length());

        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.kubernetesconfiguration.extensiontypes",
                "src/test/java", "com.azure.resourcemanager.kubernetesconfiguration.extensiontypes.generated",
                "ExtensionTypesLocationGetWithResponse", "MockTests");
        Assertions.assertEquals(maxFileLength, ("sdk/kubernetesconfiguration/azure-resourcemanager-kubernetesconfiguration-extensiontypes/src/test/java/com/azure/resourcemanager/kubernetesconfiguration/extensiontypes/generated/" + name + ".java").length());

        // do nothing as too little remaining length for class name
        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.deviceprovisioningservicespadpadpadpadpadpad",
            "src/samples/java", "com.azure.resourcemanager.deviceprovisioningservicespadpadpadpadpadpad.generated",
            "IotDpsResourceCheckProvisioningServiceNameAvailability", "Samples");
        Assertions.assertEquals("IotDpsResourceCheckProvisioningServiceNameAvailabilitySamples", name);

        // no change
        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.datafactory", "src/samples/java",
            "com.azure.resourcemanager.datafactory.generated", "DataFlowDebugSessionAddDataFlow", "Samples");
        Assertions.assertEquals("DataFlowDebugSessionAddDataFlowSamples", name);
    }
}
