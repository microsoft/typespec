// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.additionalproperties;

import io.clientcore.core.util.binarydata.BinaryData;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class MultipleSpreadTests {
    private final MultipleSpreadClient multipleSpreadClient
        = new AdditionalPropertiesClientBuilder().buildMultipleSpreadClient();

    @Test
    public void testMultipleSpread() throws IOException {
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", BinaryData.fromObject("abc"));
        propertyMap.put("prop2", BinaryData.fromObject(43.125));
        MultipleSpreadRecord body = new MultipleSpreadRecord(true);
        body.setAdditionalProperties(propertyMap);
        multipleSpreadClient.put(body);

        MultipleSpreadRecord record = multipleSpreadClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertTrue(record.isFlag());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertEquals("abc", record.getAdditionalProperties().get("prop1").toObject(String.class));
        Assertions.assertEquals(43.125, record.getAdditionalProperties().get("prop2").toObject(Double.class));
    }
}
