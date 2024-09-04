// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.client.structure;

import com.client.structure.service.BarClient;
import com.client.structure.service.BazFooClient;
import com.client.structure.service.FooClient;
import com.client.structure.service.QuxBarClient;
import com.client.structure.service.QuxClient;
import com.client.structure.service.ServiceClientClient;
import com.client.structure.service.ServiceClientClientBuilder;
import org.junit.jupiter.api.Test;

public class DefaultClientTests {

    private final ServiceClientClient client = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildClient();

    private final FooClient client2 = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildFooClient();

    private final BarClient client3 = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildBarClient();

    private final QuxClient client4 = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildQuxClient();

    private final QuxBarClient client5 = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildQuxBarClient();

    private final BazFooClient client6 = new ServiceClientClientBuilder()
            .endpoint("http://localhost:3000")
            .client("default").buildBazFooClient();

    @Test
    public void testClient() {
        client.one();
        client.two();
        client2.three();
        client2.four();
        client3.five();
        client3.six();
        client6.seven();
        client4.eight();
        client5.nine();
    }
}
