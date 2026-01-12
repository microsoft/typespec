// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package service.multiservice;

import org.junit.jupiter.api.Test;
import service.multiservice.combined.BarClient;
import service.multiservice.combined.CombinedBuilder;
import service.multiservice.combined.FooClient;

public final class MultipleServiceTests {

    private final FooClient fooClient = new CombinedBuilder().buildFooClient();
    private final BarClient barClient = new CombinedBuilder().buildBarClient();

    @Test
    public void testCombinedClient() {
        fooClient.test();
        barClient.test();
    }
}
