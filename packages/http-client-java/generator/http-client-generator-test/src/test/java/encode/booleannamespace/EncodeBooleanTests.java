// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.booleannamespace;

import encode.booleannamespace.property.models.BoolAsStringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class EncodeBooleanTests {

    private final BooleanClient client = new BooleanClientBuilder().buildClient();

    @Test
    @Disabled("@encode(string) on boolean is not yet supported by the emitter; boolean is serialized as JSON boolean instead of string")
    public void testTrueLower() {
        BoolAsStringProperty response = client.trueLower(new BoolAsStringProperty(true));
        Assertions.assertNotNull(response);
        Assertions.assertTrue(response.isValue());
    }

    @Test
    @Disabled("@encode(string) on boolean is not yet supported by the emitter; boolean is serialized as JSON boolean instead of string")
    public void testFalseLower() {
        BoolAsStringProperty response = client.falseLower(new BoolAsStringProperty(false));
        Assertions.assertNotNull(response);
        Assertions.assertFalse(response.isValue());
    }

    @Test
    @Disabled("@encode(string) on boolean is not yet supported by the emitter; boolean is serialized as JSON boolean instead of string")
    public void testTrueUpper() {
        BoolAsStringProperty response = client.trueUpper(new BoolAsStringProperty(true));
        Assertions.assertNotNull(response);
        Assertions.assertTrue(response.isValue());
    }

    @Test
    @Disabled("@encode(string) on boolean is not yet supported by the emitter; boolean is serialized as JSON boolean instead of string")
    public void testFalseMixed() {
        BoolAsStringProperty response = client.falseMixed(new BoolAsStringProperty(false));
        Assertions.assertNotNull(response);
        Assertions.assertFalse(response.isValue());
    }
}
