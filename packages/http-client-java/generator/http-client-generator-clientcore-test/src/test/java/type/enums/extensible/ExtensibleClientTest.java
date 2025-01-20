// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.enums.extensible;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class ExtensibleClientTest {

    private final ExtensibleClient client = new ExtensibleClientBuilder().buildExtensibleClient();

    @Test
    @Disabled("java.lang.ClassCastException: class java.lang.String cannot be cast to class type.enums.extensible.DaysOfWeekExtensibleEnum")
    public void getKnownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = client.getKnownValue();
        Assertions.assertEquals(DaysOfWeekExtensibleEnum.MONDAY, daysOfWeekExtensibleEnum);
    }

    @Test
    @Disabled("java.lang.ClassCastException: class java.lang.String cannot be cast to class type.enums.extensible.DaysOfWeekExtensibleEnum")
    public void getUnknownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = client.getUnknownValue();
        Assertions.assertEquals("Weekend", daysOfWeekExtensibleEnum.toString());
    }

    @Test
    public void putKnownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = DaysOfWeekExtensibleEnum.MONDAY;
        client.putKnownValue(daysOfWeekExtensibleEnum);
    }

    @Test
    public void putUnknownValue() {
        DaysOfWeekExtensibleEnum daysOfWeekExtensibleEnum = DaysOfWeekExtensibleEnum.fromValue("Weekend");
        client.putUnknownValue(daysOfWeekExtensibleEnum);
    }

}
