// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.wiretype;

import com.azure.core.util.BinaryData;
import com.cadl.wiretype.models.SubClass;
import com.cadl.wiretype.models.SubClassBothMismatch;
import com.cadl.wiretype.models.SubClassMismatch;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class WireTypeTests {

    private static final OffsetDateTime NOW = OffsetDateTime.now().withNano(0).withOffsetSameInstant(ZoneOffset.UTC);
    private static final byte[] BYTES = "test".getBytes(StandardCharsets.UTF_8);

    @Test
    public void testSuperClassMismatch() {
        SubClass model = new SubClass(NOW, NOW);

        BinaryData json = BinaryData.fromObject(model);
        SubClass model1 = json.toObject(SubClass.class);

        Assertions.assertEquals(NOW, model1.getDateTime());
        Assertions.assertEquals(NOW, model1.getDateTimeRfc7231());
    }

    @Test
    public void testSubClassMismatch() {
        SubClassMismatch model = new SubClassMismatch(NOW, NOW);

        BinaryData json = BinaryData.fromObject(model);
        SubClassMismatch model1 = json.toObject(SubClassMismatch.class);

        Assertions.assertEquals(NOW, model1.getDateTime());
        Assertions.assertEquals(NOW, model1.getDateTimeRfc7231());
    }

    @Test
    public void testBothClassMismatch() {
        SubClassBothMismatch model = new SubClassBothMismatch(NOW, BYTES);

        BinaryData json = BinaryData.fromObject(model);
        SubClassBothMismatch model1 = json.toObject(SubClassBothMismatch.class);

        Assertions.assertArrayEquals(BYTES, model1.getBase64url());
        Assertions.assertEquals(NOW, model1.getDateTimeRfc7231());
    }
}
