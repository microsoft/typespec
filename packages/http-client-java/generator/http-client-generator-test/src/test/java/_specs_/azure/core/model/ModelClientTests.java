// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package _specs_.azure.core.model;

import _specs_.azure.core.model.models.AzureEmbeddingModel;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ModelClientTests {
    private final ModelClient client = new ModelClientBuilder().buildClient();

    @Test
    public void get() {
        Assertions.assertIterableEquals(Arrays.asList(0, 1, 2, 3, 4), client.get());
    }

    @Test
    public void post() {
        AzureEmbeddingModel model = client.post(new AzureEmbeddingModel(Arrays.asList(0, 1, 2, 3, 4)));
        Assertions.assertIterableEquals(Arrays.asList(5, 6, 7, 8, 9), model.getEmbedding());
    }

    @Test
    public void put() {
        client.put(Arrays.asList(0, 1, 2, 3, 4));
    }
}
