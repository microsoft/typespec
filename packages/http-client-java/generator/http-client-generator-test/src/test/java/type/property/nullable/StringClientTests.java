// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import java.io.IOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.nullable.models.StringProperty;

public class StringClientTests {

    private final StringOperationClient stringClient = new NullableClientBuilder().buildStringOperationClient();

    @Test
    public void testStringNullable() throws IOException {

        Assertions.assertEquals("hello", stringClient.getNonNull().getNullableProperty());

        Assertions.assertNull(stringClient.getNull().getNullableProperty());

        stringClient.patchNonNull(new StringProperty().setRequiredProperty("foo").setNullableProperty("hello"));

        stringClient.patchNull(new StringProperty().setRequiredProperty("foo").setNullableProperty(null));
    }
}
