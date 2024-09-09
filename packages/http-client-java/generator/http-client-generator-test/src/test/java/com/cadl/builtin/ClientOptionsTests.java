// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.builtin;

import com.azure.core.http.HttpHeader;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.ClientOptions;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class ClientOptionsTests {

    @Test
    public void testClientOptions() {
        BuiltinClient client = new BuiltinClientBuilder()
                .endpoint("http://localhost:3000")
                .clientOptions(new ClientOptions().setHeaders(Arrays.asList(
                    new HttpHeader("header1", "value1"),
                    new HttpHeader("header2", "value2"))))
                .httpClient(request -> {
                    Assertions.assertEquals("value1", request.getHeaders().getValue(HttpHeaderName.fromString("header1")));
                    Assertions.assertEquals("value2", request.getHeaders().getValue(HttpHeaderName.fromString("header2")));
                    return Mono.just(new MockHttpResponse(request, 200, new HttpHeaders(), "{}".getBytes(StandardCharsets.UTF_8)));
                })
                .buildClient();

        client.read("", "");
    }
}
