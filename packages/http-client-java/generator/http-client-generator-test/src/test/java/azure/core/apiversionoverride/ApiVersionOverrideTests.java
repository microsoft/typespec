// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.core.apiversionoverride;

import org.junit.jupiter.api.Test;

public class ApiVersionOverrideTests {
    @Test
    public void testChildClientApiVersion() {
        new ApiVersionOverrideClientBuilder().buildClient().get();
    }
}
