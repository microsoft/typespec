// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.structure;

import client.structure.service.BarClient;
import client.structure.service.BazFooClient;
import client.structure.service.FooClient;
import client.structure.service.QuxBarClient;
import client.structure.service.QuxClient;
import client.structure.service.ServiceClientClient;
import client.structure.service.ServiceClientClientBuilder;
import client.structure.service.models.ClientType;
import org.junit.jupiter.api.Test;

public class DefaultClientTests {

    private final ServiceClientClient client
        = new ServiceClientClientBuilder().endpoint("http://localhost:3000").client(ClientType.DEFAULT).buildClient();

    private final FooClient client2 = new ServiceClientClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.DEFAULT)
        .buildFooClient();

    private final BarClient client3 = new ServiceClientClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.DEFAULT)
        .buildBarClient();

    private final QuxClient client4 = new ServiceClientClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.DEFAULT)
        .buildQuxClient();

    private final QuxBarClient client5 = new ServiceClientClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.DEFAULT)
        .buildQuxBarClient();

    private final BazFooClient client6 = new ServiceClientClientBuilder().endpoint("http://localhost:3000")
        .client(ClientType.DEFAULT)
        .buildBazFooClient();

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
