// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.example;

import azure.resourcemanager.example.models.Widget;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class ExampleTests {
    @Test
    public void testListWidgets() {
        ExampleManager manager
            = ExampleManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());
        List<Widget> widgets = manager.widgets().listByResourceGroup("test-rg").stream().collect(Collectors.toList());
        Assertions.assertEquals(1, widgets.size());
        Assertions.assertEquals("widget", widgets.get(0).name());
        Assertions.assertEquals("sample widget", widgets.get(0).properties().description());
    }
}
