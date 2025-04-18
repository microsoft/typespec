// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.path;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public final class PathTests {

    private final PathClient client = new PathClientBuilder().buildClient();

    @Test
    public void testNormal() {
        client.normal("foo");
    }

    @Disabled
    @Test
    public void testOptional() {
        client.optional();
        client.optional("foo");
    }
}
