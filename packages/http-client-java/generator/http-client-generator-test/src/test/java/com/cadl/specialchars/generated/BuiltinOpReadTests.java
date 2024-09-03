// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.specialchars.generated;

import com.cadl.specialchars.models.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled
public final class BuiltinOpReadTests extends SpecialCharsClientTestBase {
    @Test
    @Disabled
    public void testBuiltinOpReadTests() {
        // method invocation
        Resource response = specialCharsClient.read(null);

        // response assertion
        Assertions.assertNotNull(response);
    }
}
