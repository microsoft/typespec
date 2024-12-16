// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.enums.extensible;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.enums.extensible.models.DaysOfWeekExtensibleEnum;

class ExtensibleClientTest {

    ExtensibleClient client = new ExtensibleClientBuilder().buildClient();

    @Test
    void getKnownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = client.getKnownValue();
        Assertions.assertEquals(DaysOfWeekExtensibleEnum.MONDAY, daysOfWeekExtensibleEnum);
    }

    @Test
    void getUnknownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = client.getUnknownValue();
        Assertions.assertEquals("Weekend", daysOfWeekExtensibleEnum.toString());
    }

    @Test
    void putKnownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = DaysOfWeekExtensibleEnum.MONDAY;
        client.putKnownValue(daysOfWeekExtensibleEnum);
    }

    @Test
    void putUnknownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = DaysOfWeekExtensibleEnum.fromString("Weekend");
        client.putUnknownValue(daysOfWeekExtensibleEnum);
    }

}
