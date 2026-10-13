// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armapiversionoverride;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.armapiversionoverride.fluent.ArmApiVersionOverrideClient;
import tsptest.armapiversionoverride.implementation.ArmApiVersionOverrideClientBuilder;

public class ArmApiVersionOverrideTests {
    private final AtomicReference<HttpRequest> request = new AtomicReference<>();
    private final ArmApiVersionOverrideClient client
        = new ArmApiVersionOverrideClientBuilder().endpoint("https://management.azure.com")
            .subscriptionId("00000000-0000-0000-0000-000000000000")
            .pipeline(new HttpPipelineBuilder().httpClient(httpRequest -> {
                request.set(httpRequest);
                return Mono.just(new MockHttpResponse(httpRequest, 200,
                    new HttpHeaders().set("Content-Type", "application/json"), "{}".getBytes(StandardCharsets.UTF_8)));
            }).build())
            .buildClient();

    @Test
    public void testServiceApiVersion() {
        client.getNetworkInterfaces().getByResourceGroupWithResponse("test-rg", "nic", Context.NONE);

        Assertions.assertEquals("api-version=2026-03-01", request.get().getUrl().getQuery());
    }

    @Test
    public void testOperationGroupApiVersionOverride() {
        client.getVmssNetworkInterfaces().getWithResponse("test-rg", "vmss", "nic", Context.NONE);

        Assertions.assertTrue(request.get().getUrl().getPath().contains("/providers/Microsoft.Compute/"));
        Assertions.assertEquals("api-version=2018-10-01", request.get().getUrl().getQuery());
    }
}
