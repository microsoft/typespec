// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.operationtemplates;

import azure.resourcemanager.operationtemplates.models.ExportRequest;
import azure.resourcemanager.operationtemplates.models.ExportResult;
import azure.resourcemanager.operationtemplates.models.Order;
import azure.resourcemanager.operationtemplates.models.OrderProperties;
import com.azure.core.http.HttpPipeline;
import com.azure.core.management.Region;
import com.azure.core.management.profile.AzureProfile;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Constructor;
import java.time.Duration;

public class OperationTests {
    private final OperationTemplatesManager manager = buildManager();

    @Test
    public void testLro() {
        String orderName = "order1";
        String resourceGroup = "test-rg";
        Order order = manager.lroes()
            .define(orderName)
            .withRegion(Region.US_EAST)
            .withExistingResourceGroup(resourceGroup)
            .withProperties(new OrderProperties().withAmount(1).withProductId("product1"))
            .create();

        Assertions.assertEquals("Succeeded", order.properties().provisioningState());
        Assertions.assertNotNull(order.systemData());

        ExportResult exportResult = order.export(new ExportRequest().withFormat("csv"));
        Assertions.assertEquals("order1,product1,1", exportResult.content());

        manager.lroes().deleteById(order.id());
    }

    // for LRO operations, we need to override default poll interval
    private static OperationTemplatesManager buildManager() {
        try {
            Constructor<OperationTemplatesManager> constructor
                = OperationTemplatesManager.class.getDeclaredConstructor(HttpPipeline.class, AzureProfile.class, Duration.class);
            setAccessible(constructor);
            return constructor.newInstance(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile(), Duration.ofMillis(1));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static void setAccessible(final AccessibleObject accessibleObject) {
        // avoid bug in Java8
        Runnable runnable = () -> accessibleObject.setAccessible(true);
        runnable.run();
    }
}
