// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ModelClientTest {

    private final ModelClient client = new ValueTypesClientBuilder().buildModelClient();

    @Test
    public void get() {
        ModelProperty modelProperty = client.get();
        Assertions.assertEquals("hello", modelProperty.getProperty().getProperty());
    }

    @Test
    public void put() {
        InnerModel innerModel = new InnerModel("hello");
        ModelProperty modelProperty = new ModelProperty(innerModel);
        client.put(modelProperty);
    }
}
