// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClassNameUtilTests {

    // spell check
    private static final String KUBERNETES_CONFIGURATION = "kubernetes" + "configuration";

    @Test
    public void testTruncateClassName() {
        final int maxFileLength = 260 - 38;

        // truncate class name
        String name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.deviceprovisioningservices",
            "src/samples/java", "com.azure.resourcemanager.deviceprovisioningservices.generated",
            "IotDpsResourceCheckProvisioningServiceNameAvailability", "Samples");
        Assertions.assertEquals(maxFileLength,
            ("sdk/deviceprovisioningservices/azure-resourcemanager-deviceprovisioningservices/src/samples/java/com/azure/resourcemanager/deviceprovisioningservices/generated/"
                + name + ".java").length());

        name = ClassNameUtil.truncateClassName("com.azure.resourcemanager.recoveryservicessiterecovery",
            "src/test/java", "com.azure.resourcemanager.recoveryservicessiterecovery.generated",
            "InMageRcmUpdateApplianceForReplicationProtectedItemInput", "Tests");
        Assertions.assertEquals(maxFileLength,
            ("sdk/recoveryservicessiterecovery/azure-resourcemanager-recoveryservicessiterecovery/src/test/java/com/azure/resourcemanager/recoveryservicessiterecovery/generated/"
                + name + ".java").length());

        name = ClassNameUtil.truncateClassName(
            "com.azure.resourcemanager." + KUBERNETES_CONFIGURATION + ".extensiontypes", "src/test/java",
            "com.azure.resourcemanager." + KUBERNETES_CONFIGURATION + ".extensiontypes.generated",
            "ExtensionTypesLocationGetWithResponse", "MockTests");
        Assertions.assertEquals(maxFileLength,
            ("sdk/" + KUBERNETES_CONFIGURATION + "/azure-resourcemanager-" + KUBERNETES_CONFIGURATION
                + "-extensiontypes/src/test/java/com/azure/resourcemanager/" + KUBERNETES_CONFIGURATION
                + "/extensiontypes/generated/" + name + ".java").length());

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

    @Test
    public void testGetDirectoryNameForGraalVmConfig() {
        // directory length over 210
        String directoryName = ClassNameUtil.getDirectoryNameForGraalVmConfig("com.azure.resourcemanager",
            "azure-resourcemanager-" + KUBERNETES_CONFIGURATION + "-extensiontypes");
        Assertions.assertFalse(directoryName.contains("azure-resourcemanager-"));

        // directory length not over 210, but full filename length over 222
        directoryName = ClassNameUtil.getDirectoryNameForGraalVmConfig("com.azure.resourcemanager",
            "azure-resourcemanager-" + "recovery" + "services" + "data" + "replication");
        Assertions.assertFalse(directoryName.contains("azure-resourcemanager-"));
    }
}
