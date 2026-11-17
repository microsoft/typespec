// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armversioned;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.management.Region;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import tsptest.armversioned.fluent.ArmVersionedClient;
import tsptest.armversioned.fluent.models.TopLevelArmResourceInner;
import tsptest.armversioned.implementation.ArmVersionedClientBuilder;
import tsptest.armversioned.models.ActionRequest;
import tsptest.armversioned.models.TopLevelArmResource;

public class ArmVersionedTests {
    private final AtomicReference<HttpRequest> request = new AtomicReference<>();
    private final ArmVersionedClient client = new ArmVersionedClientBuilder().endpoint("https://management.azure.com")
        .subscriptionId("00000000-0000-0000-0000-000000000000")
        .pipeline(new HttpPipelineBuilder().httpClient(httpRequest -> {
            request.set(httpRequest);
            return Mono.just(new MockHttpResponse(httpRequest, 200,
                new HttpHeaders().set("Content-Type", "application/json"), "{}".getBytes(StandardCharsets.UTF_8)));
        }).build())
        .buildClient();

    @Test
    public void testHistoricalOptionalBody() {
        client.getTopLevelArmResources().getLimitsWithResponse("westus", Context.NONE);
        Assertions.assertTrue(
            request.get().getBodyAsBinaryData() == null || request.get().getBodyAsBinaryData().toBytes().length == 0);

        client.getTopLevelArmResources()
            .getLimitsWithResponse("westus", new ActionRequest().withValue("value"), Context.NONE);
        Assertions.assertEquals("{\"value\":\"value\"}", request.get().getBodyAsBinaryData().toString());
    }

    @Test
    public void testHistoricalQueryAndHeader() {
        client.getTopLevelArmResources().getByResourceGroupWithResponse("resourceGroup", "resourceName", Context.NONE);
        Assertions.assertEquals("api-version=2024-12-01", request.get().getUrl().getQuery());
        Assertions.assertNull(request.get().getHeaders().getValue("new-header"));

        client.getTopLevelArmResources()
            .getByResourceGroupWithResponse("resourceGroup", "resourceName", "query", "header", Context.NONE);
        Assertions.assertTrue(request.get().getUrl().getQuery().contains("newParameter=query"));
        Assertions.assertEquals("header", request.get().getHeaders().getValue("new-header"));
    }

    // only to test compilation
    public void testVersionedApi() {
        ArmVersionedManager manager = Mockito.mock(ArmVersionedManager.class);
        TopLevelArmResourceInner resourceInner = Mockito.mock(TopLevelArmResourceInner.class);

        // API without optional parameter
        // this API exists in all versions
        manager.topLevelArmResources().list();

        manager.topLevelArmResources().listByResourceGroup("resourceGroup");

        manager.topLevelArmResources().action("resourceGroup", "resourceName");

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner);
        TopLevelArmResource resource = manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .create();

        resource.update().apply();

        manager.topLevelArmResources().delete("resourceGroup", "resourceName");
        manager.topLevelArmResources().deleteById("id");

        resource.refresh();

        // API in 2024-12-01
        manager.topLevelArmResources().list("newParameter", "newHeader", Context.NONE);

        manager.topLevelArmResources().listByResourceGroup("resourceGroup", "parameter", "newParameter", Context.NONE);

        manager.topLevelArmResources()
            .actionWithResponse("resourceGroup", "resourceName", "parameter", "newParameter", Context.NONE);

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner, "newParameter", "newHeader", Context.NONE);
        manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .withNextLink("newParameter")
            .withNewHeader("newHeader")
            .create();

        resource.update().withNextLink("newParameter").withNewHeader("newHeader").apply();

        manager.serviceClient()
            .getTopLevelArmResources()
            .getByResourceGroupWithResponse("resourceGroup", "resourceName", "newParameter", "newHeader", Context.NONE);
        manager.serviceClient()
            .getTopLevelArmResources()
            .getLimitsWithResponse("westus", new ActionRequest().withValue("value"), Context.NONE);

        manager.topLevelArmResources()
            .deleteWithResponse("resourceGroup", "resourceName", "parameter", "newParameter", Context.NONE);
        manager.topLevelArmResources().deleteByIdWithResponse("id", "parameter", "newParameter", Context.NONE);

        // API in 2023-12-01
        // this op will be generated, if tspconfig has "advanced-versioning" option
        // REST API allow adding optional parameter to operation
        manager.topLevelArmResources().list(Context.NONE);

        manager.topLevelArmResources().listByResourceGroup("resourceGroup", "parameter", Context.NONE);

        manager.topLevelArmResources().actionWithResponse("resourceGroup", "resourceName", "parameter", Context.NONE);

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner, Context.NONE);
        manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .create();

        resource.update().apply();

        manager.serviceClient()
            .getTopLevelArmResources()
            .getByResourceGroupWithResponse("resourceGroup", "resourceName", Context.NONE);
        manager.serviceClient().getTopLevelArmResources().getLimitsWithResponse("westus", Context.NONE);

        manager.topLevelArmResources().deleteWithResponse("resourceGroup", "resourceName", "parameter", Context.NONE);
        manager.topLevelArmResources().deleteByIdWithResponse("id", "parameter", Context.NONE);
    }
}
