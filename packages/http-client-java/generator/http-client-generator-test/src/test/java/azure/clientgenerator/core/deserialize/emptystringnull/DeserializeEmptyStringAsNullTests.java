// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.deserialize.emptystringnull;

import azure.clientgenerator.core.deserialize.emptystringnull.models.ResponseModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class DeserializeEmptyStringAsNullTests {

    private final DeserializeEmptyStringAsNullClient client
        = new DeserializeEmptyStringAsNullClientBuilder().buildClient();

    @Test
    public void testDeserializeEmptyStringAsNull() {
        ResponseModel model = client.get();
        Assertions.assertEquals("", model.getSampleUrl());
    }
}
