// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.optional.models.UnionFloatLiteralProperty;
import type.property.optional.models.UnionFloatLiteralPropertyProperty;

public class UnionFloatLiteralClientTests {
    private final UnionFloatLiteralClient client = new OptionalClientBuilder().buildUnionFloatLiteralClient();

    @Test
    public void getAll() {
        UnionFloatLiteralProperty unionFloatLiteralProperty = client.getAll();
        Assertions.assertEquals(UnionFloatLiteralPropertyProperty.TWO_THREE_SEVEN_FIVE,
            unionFloatLiteralProperty.getProperty());
    }

    @Test
    public void getDefault() {
        UnionFloatLiteralProperty unionFloatLiteralProperty = client.getDefault();
        Assertions.assertNull(unionFloatLiteralProperty.getProperty());
    }

    @Test
    public void putAll() {
        UnionFloatLiteralProperty unionFloatLiteralProperty = new UnionFloatLiteralProperty();
        unionFloatLiteralProperty.setProperty(UnionFloatLiteralPropertyProperty.TWO_THREE_SEVEN_FIVE);
        client.putAll(unionFloatLiteralProperty);
    }

    @Test
    public void putDefault() {
        UnionFloatLiteralProperty unionFloatLiteralProperty = new UnionFloatLiteralProperty();
        client.putDefault(unionFloatLiteralProperty);
    }
}
