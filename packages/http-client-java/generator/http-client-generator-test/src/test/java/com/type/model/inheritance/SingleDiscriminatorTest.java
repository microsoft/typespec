// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.inheritance;

import com.type.model.inheritance.singlediscriminator.SingleDiscriminatorClient;
import com.type.model.inheritance.singlediscriminator.SingleDiscriminatorClientBuilder;
import com.type.model.inheritance.singlediscriminator.models.Bird;
import com.type.model.inheritance.singlediscriminator.models.Eagle;
import com.type.model.inheritance.singlediscriminator.models.Goose;
import com.type.model.inheritance.singlediscriminator.models.SeaGull;
import com.type.model.inheritance.singlediscriminator.models.Sparrow;
import com.type.model.inheritance.singlediscriminator.models.TRex;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class SingleDiscriminatorTest {

    private final SingleDiscriminatorClient client = new SingleDiscriminatorClientBuilder().buildClient();

    @Test
    public void testSingleDiscriminator() {
        Assertions.assertEquals(TRex.class, client.getLegacyModel().getClass());

        client.getMissingDiscriminator();
        client.getWrongDiscriminator();

        Bird model = client.getModel();
        Assertions.assertEquals(Sparrow.class, model.getClass());
        client.putModel(model);

        Eagle recursiveModel = (Eagle) client.getRecursiveModel();
        Assertions.assertEquals(Eagle.class, recursiveModel.getClass());
        Assertions.assertEquals(Goose.class, recursiveModel.getPartner().getClass());
        Assertions.assertEquals(SeaGull.class, recursiveModel.getFriends().get(0).getClass());
        Assertions.assertEquals(Sparrow.class, recursiveModel.getHate().get("key3").getClass());
        client.putRecursiveModel(recursiveModel);
    }
}
