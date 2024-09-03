// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import org.junit.jupiter.api.Test;

public class DecimalTests {

    private final DecimalClient client1 = new ValueTypesClientBuilder().buildDecimalClient();
    private final Decimal128Client client2 = new ValueTypesClientBuilder().buildDecimal128Client();

    @Test
    public void test() {
        client1.put(client1.get());

        client2.put(client2.get());
    }
}
