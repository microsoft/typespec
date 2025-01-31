// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.numeric;

import encode.numeric.property.models.SafeintAsStringProperty;
import encode.numeric.property.models.Uint32AsStringProperty;
import encode.numeric.property.models.Uint8AsStringProperty;
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
