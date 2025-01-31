// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.inheritance;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.model.inheritance.enumdiscriminator.EnumDiscriminatorClient;
import type.model.inheritance.enumdiscriminator.EnumDiscriminatorClientBuilder;
import type.model.inheritance.enumdiscriminator.models.Cobra;
import type.model.inheritance.enumdiscriminator.models.Dog;
import type.model.inheritance.enumdiscriminator.models.Golden;
import type.model.inheritance.enumdiscriminator.models.Snake;

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
