// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.booleannamespace;

import encode.booleannamespace.property.models.BoolAsStringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EncodeBooleanTests {

    private final BooleanClient client = new BooleanClientBuilder().buildClient();

    @Test
    public void testProperty() {
        Assertions.assertTrue(client.trueLower(new BoolAsStringProperty(true)).isValue());
        Assertions.assertFalse(client.falseLower(new BoolAsStringProperty(false)).isValue());
        Assertions.assertTrue(client.trueUpper(new BoolAsStringProperty(true)).isValue());
        Assertions.assertFalse(client.falseMixed(new BoolAsStringProperty(false)).isValue());
    }
}
