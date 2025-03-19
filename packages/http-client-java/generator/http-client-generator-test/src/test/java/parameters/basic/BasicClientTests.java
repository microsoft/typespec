// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.basic;

import org.junit.jupiter.api.Test;
import parameters.basic.explicitbody.models.User;

public class BasicClientTests {
    private final ExplicitBodyClient explicitBodyClient = new BasicClientBuilder().buildExplicitBodyClient();
    private final ImplicitBodyClient implicitBodyClient = new BasicClientBuilder().buildImplicitBodyClient();

    @Test
    public void testBodyClient() {
        explicitBodyClient.simple(new User("foo"));
        implicitBodyClient.simple("foo");
    }
}
