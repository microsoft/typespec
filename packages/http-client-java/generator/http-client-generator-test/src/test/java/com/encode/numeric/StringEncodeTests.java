// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.encode.numeric;

import com.encode.numeric.models.SafeintAsStringProperty;
import com.encode.numeric.models.Uint32AsStringProperty;
import com.encode.numeric.models.Uint8AsStringProperty;
import org.junit.jupiter.api.Test;

public class StringEncodeTests {

    private final NumericClient client = new NumericClientBuilder().buildClient();

    @Test
    public void testIntEncodedAsString() {
        client.safeintAsString(new SafeintAsStringProperty(10000000000L));

        client.uint32AsStringOptional(new Uint32AsStringProperty().setValue(1));

        client.uint8AsString(new Uint8AsStringProperty(255));
    }
}
