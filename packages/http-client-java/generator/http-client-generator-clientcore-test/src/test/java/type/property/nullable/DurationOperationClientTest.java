// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Duration;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DurationOperationClientTest {

    private final DurationOperationClient client = new NullableClientBuilder().buildDurationOperationClient();

    @Test
    @Disabled("Body provided doesn't match expected body, \"expected\":{\"requiredProperty\":\"foo\",\"nullableProperty\":\"P123DT22H14M12.011S\"},\"actual\":{\"requiredProperty\":\"foo\",\"nullableProperty\":\"PT2974H14M12.011S\"}")
    public void patchNonNullWithResponse() {
        DurationProperty property = new DurationProperty().setRequiredProperty("foo")
            .setNullableProperty(Duration.parse("PT2974H14M12.011S"));
        client.patchNonNull(property);
    }

    @Disabled
    @Test
    public void patchNullWithResponse() {
        client.patchNull(new DurationProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    public void getNonNull() {
        DurationProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    public void getNull() {
        DurationProperty response = client.getNull();
        assertNull(response.getNullableProperty());

    }
}
