// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armresourceprovider;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;
import reactor.core.publisher.Mono;
import tsptest.armresourceprovider.models.TopLevelArmResource;

public class ResourceIdParsingTests {
    private static final String RESOURCE_GROUP = "topLevelArmResources";
    private static final String ID = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/"
        + RESOURCE_GROUP + "/providers/TspTest.ArmResourceProvider/topLevelArmResources/farm";
    private static final String RESOURCE_JSON = "{\"id\":\"" + ID
        + "\",\"name\":\"farm\",\"type\":\"TspTest.ArmResourceProvider/topLevelArmResources\",\"location\":\"eastus\"}";
    private final AtomicReference<HttpRequest> request = new AtomicReference<>();
    private final AtomicReference<String> responseId = new AtomicReference<>(ID);
    private final ArmResourceProviderManager manager
        = ArmResourceProviderManager.authenticate(new HttpPipelineBuilder().httpClient(httpRequest -> {
            request.set(httpRequest);
            boolean delete = httpRequest.getHttpMethod() == HttpMethod.DELETE;
            String resource = RESOURCE_JSON.replace(ID, responseId.get());
            String body = httpRequest.getUrl().getPath().endsWith("/topLevelArmResources")
                ? "{\"value\":[" + resource + "]}"
                : resource;
            return Mono.just(new MockHttpResponse(httpRequest, delete ? 204 : 200,
                new HttpHeaders().set("Content-Type", "application/json"),
                (delete ? "" : body).getBytes(StandardCharsets.UTF_8)));
        }).build(), ArmUtils.getAzureProfile());

    @Test
    public void collectionOperationsUseTemplateParameter() {
        manager.topLevelArmResourceInterfaces().getById(ID);
        assertRequest(HttpMethod.GET, ID);
        manager.topLevelArmResourceInterfaces().getByIdWithResponse(ID, Context.NONE);
        assertRequest(HttpMethod.GET, ID);
        manager.topLevelArmResourceInterfaces().deleteById(ID);
        assertRequest(HttpMethod.DELETE, ID);
        manager.topLevelArmResourceInterfaces().deleteByIdWithResponse(ID, Context.NONE);
        assertRequest(HttpMethod.DELETE, ID);
    }

    @Test
    public void getResponseWrapperRetainsCorrectResourceName() {
        TopLevelArmResource resource
            = manager.topLevelArmResourceInterfaces().getByResourceGroup(RESOURCE_GROUP, "farm");
        assertWrapperRequests(resource);
    }

    @Test
    public void listResponseWrapperRetainsCorrectResourceName() {
        TopLevelArmResource resource
            = manager.topLevelArmResourceInterfaces().listByResourceGroup(RESOURCE_GROUP).iterator().next();
        assertWrapperRequests(resource);
    }

    @Test
    public void accountScopedResponsesRetainRouteParameters() throws ReflectiveOperationException {
        responseId.set(ID.replace("/topLevelArmResources/farm", "/accounts/account/topLevelArmResources/farm"));
        assertSharedWrapper(manager.accountResources().get(RESOURCE_GROUP, "account", "farm"));
        assertSharedWrapper(
            manager.accountResources().getWithResponse(RESOURCE_GROUP, "account", "farm", Context.NONE).getValue());
        assertSharedWrapper(manager.accountResources().list(RESOURCE_GROUP, "account").iterator().next());
    }

    @Test
    public void nestedResponsesRetainRouteParameters() throws ReflectiveOperationException {
        responseId.set(ID.replace("/topLevelArmResources/farm",
            "/labs/topLevelArmResources/machines/resourceGroups/topLevelArmResources/farm"));
        assertSharedWrapper(
            manager.machineResources().get(RESOURCE_GROUP, "topLevelArmResources", "resourceGroups", "farm"));
        assertSharedWrapper(manager.machineResources()
            .list(RESOURCE_GROUP, "topLevelArmResources", "resourceGroups")
            .iterator()
            .next());
    }

    @Test
    public void sharedWrapperRejectsUnknownResourcePath() throws ReflectiveOperationException {
        String accountId = ID.replace("/topLevelArmResources/farm", "/accounts/account/topLevelArmResources/farm");
        for (String invalidId : new String[] {
            accountId.replace("TspTest.ArmResourceProvider", "Other"),
            accountId.replace("/accounts/", "/unknown/"),
            accountId + "/extra",
            accountId.substring(0, accountId.lastIndexOf('/')),
            ID.replace("/resourceGroups/" + RESOURCE_GROUP, "") }) {
            responseId.set(invalidId);
            TopLevelArmResource resource = manager.accountResources().get(RESOURCE_GROUP, "account", "farm");
            Assertions.assertNull(resource.resourceGroupName());
            Assertions.assertNull(cachedResourceName(resource));
        }
    }

    @Test
    public void invalidIdFailsBeforeSendingRequest() {
        Assertions.assertThrows(IllegalArgumentException.class,
            () -> manager.topLevelArmResourceInterfaces().getById(ID.replace("TspTest.ArmResourceProvider", "Other")));
        Assertions.assertThrows(IllegalArgumentException.class,
            () -> manager.topLevelArmResourceInterfaces().deleteById(ID.substring(0, ID.lastIndexOf('/'))));
        Assertions.assertNull(request.get());
    }

    private void assertWrapperRequests(TopLevelArmResource resource) {
        Assertions.assertEquals(RESOURCE_GROUP, resource.resourceGroupName());
        resource.refresh();
        assertRequest(HttpMethod.GET, ID);
        resource.update().withTags(Map.of("test", "value")).apply();
        assertRequest(HttpMethod.PATCH, ID);
        resource.action();
        assertRequest(HttpMethod.POST, ID + "/action");
    }

    private void assertSharedWrapper(TopLevelArmResource resource) throws ReflectiveOperationException {
        Assertions.assertEquals(RESOURCE_GROUP, resource.resourceGroupName());
        Assertions.assertEquals("farm", cachedResourceName(resource));
    }

    private String cachedResourceName(TopLevelArmResource resource) throws ReflectiveOperationException {
        // name() reads the response body, not the cached parameter used by wrapper operations.
        java.lang.reflect.Field field = resource.getClass().getDeclaredField("topLevelArmResourceName");
        field.setAccessible(true);
        return (String) field.get(resource);
    }

    private void assertRequest(HttpMethod method, String path) {
        Assertions.assertEquals(method, request.get().getHttpMethod());
        Assertions.assertEquals(path, request.get().getUrl().getPath());
    }
}
