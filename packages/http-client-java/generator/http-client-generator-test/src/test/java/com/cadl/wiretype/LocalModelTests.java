// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.wiretype;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class LocalModelTests {

    @Test
    public void testLocalModel() {
        OffsetDateTime now = OffsetDateTime.now().withNano(0).withOffsetSameInstant(ZoneOffset.UTC);

        Model model = new Model(now);
        BinaryData json = BinaryData.fromObject(model);

        Model model1 = json.toObject(Model.class);
        Assertions.assertEquals(now, model1.getDateTimeRfc7231());
    }
}
