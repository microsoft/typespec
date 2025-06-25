// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class RequiredAndOptionalClientTest {
    private final RequiredAndOptionalClient client = new OptionalClientBuilder().buildRequiredAndOptionalClient();

    @Test
    public void getAll() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = client.getAll();
        Assertions.assertEquals("hello", requiredAndOptionalProperty.getOptionalProperty());
        Assertions.assertEquals(42, requiredAndOptionalProperty.getRequiredProperty());
    }

    @Test
    public void getRequiredOnly() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = client.getRequiredOnly();
        Assertions.assertEquals(42, requiredAndOptionalProperty.getRequiredProperty());
        Assertions.assertNull(requiredAndOptionalProperty.getOptionalProperty());
    }

    @Test
    public void putAll() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = new RequiredAndOptionalProperty(42);
        requiredAndOptionalProperty.setOptionalProperty("hello");
        client.putAll(requiredAndOptionalProperty);
    }

    @Test
    public void putRequiredOnly() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = new RequiredAndOptionalProperty(42);
        client.putRequiredOnly(requiredAndOptionalProperty);
    }
}
