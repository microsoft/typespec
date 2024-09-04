// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.type.property.valuetypes.models.UnionFloatLiteralProperty;
import com.type.property.valuetypes.models.UnionFloatLiteralPropertyProperty;
import com.type.property.valuetypes.models.UnionIntLiteralProperty;
import com.type.property.valuetypes.models.UnionIntLiteralPropertyProperty;
import com.type.property.valuetypes.models.UnionStringLiteralProperty;
import com.type.property.valuetypes.models.UnionStringLiteralPropertyProperty;

public class UnionTests {
    private final UnionStringLiteralClient unionStringClient = new ValueTypesClientBuilder().buildUnionStringLiteralClient();
    private final UnionFloatLiteralClient unionFloatClient = new ValueTypesClientBuilder().buildUnionFloatLiteralClient();
    private final UnionIntLiteralClient unionIntClient = new ValueTypesClientBuilder().buildUnionIntLiteralClient();

    @Test
    public void testUnionStringLiteral() {
        UnionStringLiteralProperty body = new UnionStringLiteralProperty(UnionStringLiteralPropertyProperty.WORLD);
        unionStringClient.put(body);

        Assertions.assertNotNull(unionStringClient.get());
        Assertions.assertEquals(UnionStringLiteralPropertyProperty.WORLD, unionStringClient.get().getProperty());
    }

    @Test
    public void testUnionFloatLiteral() {
        UnionFloatLiteralProperty body = new UnionFloatLiteralProperty(UnionFloatLiteralPropertyProperty.FOUR_SIX_EIGHT_SEVEN_FIVE);
        unionFloatClient.put(body);

        Assertions.assertNotNull(unionFloatClient.get());
        Assertions.assertEquals(UnionFloatLiteralPropertyProperty.FOUR_SIX_EIGHT_SEVEN_FIVE, unionFloatClient.get().getProperty());
    }

    @Test
    public void testUnionIntLiteral() {
        UnionIntLiteralProperty body = new UnionIntLiteralProperty(UnionIntLiteralPropertyProperty.FOUR_TWO);
        unionIntClient.put(body);

        Assertions.assertNotNull(unionIntClient.get());
        Assertions.assertEquals(UnionIntLiteralPropertyProperty.FOUR_TWO, unionIntClient.get().getProperty());
    }
}
