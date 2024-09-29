// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.net.MalformedURLException;
import java.net.URL;

public class ProxyMethodExampleTests {

    @Test
    public void testGetRelativeOriginalFileNameForSwagger() throws MalformedURLException {
        URL url = new URL("file:///C:/github/azure-rest-api-specs/specification/standbypool/resource-manager/Microsoft.StandbyPool/preview/2023-12-01-preview/examples/StandbyVirtualMachinePools_Update.json");
        String result = ProxyMethodExample.getRelativeOriginalFileNameForSwagger(url);
        Assertions.assertEquals("specification/standbypool/resource-manager/Microsoft.StandbyPool/preview/2023-12-01-preview/examples/StandbyVirtualMachinePools_Update.json", result);
    }
}
