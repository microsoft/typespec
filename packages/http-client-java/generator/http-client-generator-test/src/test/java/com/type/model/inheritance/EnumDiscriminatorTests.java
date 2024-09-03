// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.inheritance;

import com.type.model.inheritance.enumdiscriminator.EnumDiscriminatorClient;
import com.type.model.inheritance.enumdiscriminator.EnumDiscriminatorClientBuilder;
import com.type.model.inheritance.enumdiscriminator.models.Cobra;
import com.type.model.inheritance.enumdiscriminator.models.Dog;
import com.type.model.inheritance.enumdiscriminator.models.Golden;
import com.type.model.inheritance.enumdiscriminator.models.Snake;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class EnumDiscriminatorTests {

    private final EnumDiscriminatorClient client = new EnumDiscriminatorClientBuilder().buildClient();

    @Test
    public void testEnumDiscriminator() {
        Snake fixedModel = client.getFixedModel();
        Assertions.assertEquals(Cobra.class, fixedModel.getClass());
        client.putFixedModel(fixedModel);

        Dog extensibleModel = client.getExtensibleModel();
        Assertions.assertEquals(Golden.class, extensibleModel.getClass());
        client.putExtensibleModel(extensibleModel);

        client.getFixedModelMissingDiscriminator();
        client.getFixedModelWrongDiscriminator();

        client.getExtensibleModelMissingDiscriminator();
        client.getExtensibleModelWrongDiscriminator();
    }
}
