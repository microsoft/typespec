// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import java.time.Duration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DurationOperationClientTest {

    private final DurationOperationClient client = new OptionalClientBuilder().buildDurationOperationClient();

    @Test
    public void getAll() {
        DurationProperty durationProperty = client.getAll();
        Assertions.assertEquals("PT2974H14M12.011S", durationProperty.getProperty().toString());
    }

    @Test
    public void getDefault() {
        DurationProperty durationProperty = client.getDefault();
        Assertions.assertNull(durationProperty.getProperty());
    }

    @Test
    @Disabled("Body provided doesn't match expected body, \"expected\":{\"property\":\"P123DT22H14M12.011S\"},\"actual\":{\"property\":\"PT2974H14M12.011S\"}")
    public void putAll() {
        Duration duration = Duration.parse("PT2974H14M12.011S");
        DurationProperty property = new DurationProperty();
        property.setProperty(duration);
        client.putAll(property);
    }

    @Test
    public void putDefault() {
        DurationProperty property = new DurationProperty();
        client.putDefault(property);
    }
}
