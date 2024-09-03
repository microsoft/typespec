// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.specialheaders.repeatability;

import org.junit.jupiter.api.Test;

public class RepeatabilityTests {

    private final RepeatabilityClient client = new RepeatabilityClientBuilder().buildClient();

    @Test
    public void testRepeatability() {
        client.immediateSuccess();
    }
}
