// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.enums.extensible;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class ExtensibleClientTest {

    ExtensibleClient client = new ExtensibleClientBuilder().buildExtensibleClient();

    @Test
    @Disabled("type.enums.extensible.DaysOfWeekExtensibleEnum is in unnamed module of loader 'app'")
    void getKnownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = client.getKnownValue();
        Assertions.assertEquals(DaysOfWeekExtensibleEnum.MONDAY, daysOfWeekExtensibleEnum);
    }

    @Test
    @Disabled("type.enums.extensible.DaysOfWeekExtensibleEnum is in unnamed module of loader 'app'")
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
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = DaysOfWeekExtensibleEnum.fromValue("Weekend");
        client.putUnknownValue(daysOfWeekExtensibleEnum);
    }

}
