// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.parameters.basic;

import com.parameters.basic.models.User;
import org.junit.jupiter.api.Test;

public class BasicClientTests {
    private final ExplicitBodyClient explicitBodyClient = new BasicClientBuilder().buildExplicitBodyClient();
    private final ImplicitBodyClient implicitBodyClient = new BasicClientBuilder().buildImplicitBodyClient();

    @Test
    public void testBodyClient() {
        explicitBodyClient.simple(new User("foo"));
        implicitBodyClient.simple("foo");
    }
}
