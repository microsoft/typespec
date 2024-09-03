// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.server;

import com.azure.core.http.rest.RequestOptions;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class ServerTests {

    @Disabled("test calls httpbin.org")
    @Test
    public void serverTests() {
        HttpbinClient client = new HttpbinClientBuilder()
                .domain("httpbin")
                .tld("org")
                .buildClient();
        Assertions.assertEquals(204, client.statusWithResponse(204, new RequestOptions()).getStatusCode());
    }
}
