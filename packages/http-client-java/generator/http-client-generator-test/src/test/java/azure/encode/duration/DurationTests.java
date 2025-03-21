// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.encode.duration;

import azure.encode.duration.models.DurationModel;
import org.junit.jupiter.api.Test;

public final class DurationTests {

    private final DurationClient client = new DurationClientBuilder().buildClient();

    @Test
    public void testDurationConstant() {
        client.durationConstant(new DurationModel("1.02:59:59.5000000"));
    }
}
