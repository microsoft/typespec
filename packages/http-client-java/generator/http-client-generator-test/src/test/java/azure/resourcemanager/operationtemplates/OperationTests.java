// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.operationtemplates;

import azure.resourcemanager.operationtemplates.fluent.models.WidgetInner;
import azure.resourcemanager.operationtemplates.models.ActionRequest;
import azure.resourcemanager.operationtemplates.models.ActionResult;
import azure.resourcemanager.operationtemplates.models.ActionType;
import azure.resourcemanager.operationtemplates.models.ChangeAllowanceRequest;
import azure.resourcemanager.operationtemplates.models.ChangeAllowanceResult;
import azure.resourcemanager.operationtemplates.models.CheckNameAvailabilityReason;
import azure.resourcemanager.operationtemplates.models.CheckNameAvailabilityRequest;
import azure.resourcemanager.operationtemplates.models.CheckNameAvailabilityResponse;
import azure.resourcemanager.operationtemplates.models.ExportRequest;
import azure.resourcemanager.operationtemplates.models.ExportResult;
import azure.resourcemanager.operationtemplates.models.Operation;
import azure.resourcemanager.operationtemplates.models.OperationDisplay;
import azure.resourcemanager.operationtemplates.models.Order;
import azure.resourcemanager.operationtemplates.models.OrderProperties;
import azure.resourcemanager.operationtemplates.models.Origin;
import azure.resourcemanager.operationtemplates.models.Widget;
import azure.resourcemanager.operationtemplates.models.WidgetProperties;
import com.azure.core.http.HttpPipeline;
import com.azure.core.management.Region;
import com.azure.core.management.profile.AzureProfile;
import com.azure.core.util.Context;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Constructor;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class OperationTests {
    private final OperationTemplatesManager manager = buildManager();

    @Test
    public void testCheckNameAvailability() {
        CheckNameAvailabilityRequest request
            = new CheckNameAvailabilityRequest().withName("checkName").withType("Microsoft.Web/site");

        CheckNameAvailabilityResponse response = manager.checkNameAvailabilities().checkGlobal(request);
        Assertions.assertFalse(response.nameAvailable());
        Assertions.assertEquals(CheckNameAvailabilityReason.ALREADY_EXISTS, response.reason());
        Assertions.assertEquals("Hostname 'checkName' already exists. Please select a different name.",
            response.message());

        response = manager.checkNameAvailabilities().checkLocal("westus", request);
        Assertions.assertFalse(response.nameAvailable());
        Assertions.assertEquals(CheckNameAvailabilityReason.ALREADY_EXISTS, response.reason());
        Assertions.assertEquals("Hostname 'checkName' already exists. Please select a different name.",
            response.message());
    }

    @Test
    public void testListAvailableOperations() {
        List<Operation> operationList = manager.operations().list().stream().collect(Collectors.toList());
        Assertions.assertFalse(operationList.isEmpty());
        Assertions.assertEquals(1, operationList.size());
        Operation operation = operationList.get(0);
        Assertions.assertNotNull(operation);
        Assertions.assertEquals("Microsoft.Compute/virtualMachines/write", operation.name());
        Assertions.assertFalse(operation.isDataAction());
        OperationDisplay display = operation.display();
        Assertions.assertNotNull(display);
        Assertions.assertEquals("Microsoft Compute", display.provider());
        Assertions.assertEquals("Virtual Machines", display.resource());
        Assertions.assertEquals("Create or Update Virtual Machine.", display.operation());
        Assertions.assertEquals("Add or modify virtual machines.", display.description());
        Assertions.assertEquals(Origin.USER_SYSTEM, operation.origin());
        Assertions.assertEquals(ActionType.INTERNAL, operation.actionType());
    }

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

    @Test
    public void testOptionalBody() {
        String rgName = "test-rg";
        String resourceName = "widget1";
        Widget widget = manager.optionalBodies().getByResourceGroup(rgName, resourceName);
        Assertions.assertEquals("A test widget", widget.properties().description());
        widget = manager.optionalBodies().patch(rgName, resourceName);
        Assertions.assertEquals("A test widget", widget.properties().description());

        ChangeAllowanceResult result = manager.optionalBodies().providerPost();
        Assertions.assertEquals(50, result.totalAllowed());
        Assertions.assertEquals("Changed to default allowance", result.status());
        result = manager.optionalBodies()
            .providerPostWithResponse(new ChangeAllowanceRequest().withReason("Increased demand").withTotalAllowed(100),
                Context.NONE)
            .getValue();
        Assertions.assertEquals(100, result.totalAllowed());
        Assertions.assertEquals("Changed to requested allowance", result.status());

        WidgetInner inner = widget.innerModel();
        inner.withProperties(new WidgetProperties().withName("updated-widget").withDescription("Updated description"));
        widget = manager.optionalBodies().patchWithResponse(rgName, resourceName, inner, Context.NONE).getValue();
        Assertions.assertEquals("Updated description", widget.properties().description());
        Assertions.assertEquals("updated-widget", widget.properties().name());

        ActionResult actionResult = manager.optionalBodies().post(rgName, resourceName);
        Assertions.assertEquals("Action completed successfully", actionResult.result());

        actionResult = manager.optionalBodies()
            .postWithResponse(rgName, resourceName,
                new ActionRequest().withActionType("perform").withParameters("test-parameters"), Context.NONE)
            .getValue();
        Assertions.assertEquals("Action completed successfully with parameters", actionResult.result());
    }

    // for LRO operations, we need to override default poll interval
    private static OperationTemplatesManager buildManager() {
        try {
            Constructor<OperationTemplatesManager> constructor = OperationTemplatesManager.class
                .getDeclaredConstructor(HttpPipeline.class, AzureProfile.class, Duration.class);
            setAccessible(constructor);
            return constructor.newInstance(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile(),
                Duration.ofMillis(1));
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
