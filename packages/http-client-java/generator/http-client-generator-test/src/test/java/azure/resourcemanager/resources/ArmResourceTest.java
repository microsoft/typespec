// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.resources;

import azure.resourcemanager.resources.fluent.models.SingletonTrackedResourceInner;
import azure.resourcemanager.resources.models.ExtensionsResource;
import azure.resourcemanager.resources.models.ExtensionsResourceProperties;
import azure.resourcemanager.resources.models.LocationResource;
import azure.resourcemanager.resources.models.LocationResourceProperties;
import azure.resourcemanager.resources.models.NestedProxyResource;
import azure.resourcemanager.resources.models.NestedProxyResourceProperties;
import azure.resourcemanager.resources.models.NotificationDetails;
import azure.resourcemanager.resources.models.ProvisioningState;
import azure.resourcemanager.resources.models.SingletonTrackedResource;
import azure.resourcemanager.resources.models.SingletonTrackedResourceProperties;
import azure.resourcemanager.resources.models.TopLevelTrackedResource;
import azure.resourcemanager.resources.models.TopLevelTrackedResourceProperties;
import com.azure.core.management.Region;
import com.azure.core.util.Context;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class ArmResourceTest {
    private static final String TOP_LEVEL_TRACKED_RESOURCE_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top";
    private static final String TOP_LEVEL_TRACKED_RESOURCE_NAME = "top";
    private static final String TOP_LEVEL_TRACKED_RESOURCE_TYPE
        = "Azure.ResourceManager.Resources/topLevelTrackedResources";
    private static final String NESTED_PROXY_RESOURCE_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources/nested";
    private static final String NESTED_PROXY_RESOURCE_NAME = "nested";
    private static final String NESTED_PROXY_RESOURCE_TYPE
        = "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources";
    private static final Region TOP_LEVEL_TRACKED_RESOURCE_REGION = Region.US_EAST;
    private static final String RESOURCE_DESCRIPTION_VALID = "valid";
    private static final String RESOURCE_DESCRIPTION_VALID2 = "valid2";
    private static final ProvisioningState RESOURCE_PROVISIONING_STATE = ProvisioningState.SUCCEEDED;
    private static final String RESOURCE_GROUP_NAME = "test-rg";
    private static final String NOTIFICATION_DETAILS_MESSAGE = "Resource action at top level.";
    private static final String LOCATION_RESOURCE_NAME = "resource";
    private static final String LOCATION_RESOURCE_LOCATION = "eastus";
    private static final String LOCATION_RESOURCE_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/locations/eastus/locationResources/resource";
    private static final String LOCATION_RESOURCE_TYPE = "Azure.ResourceManager.Resources/locationResources";
    private static final String EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI
        = "/subscriptions/00000000-0000-0000-0000-000000000000";
    private static final String EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg";
    private static final String EXTENSION_RESOURCE_RESOURCE_SCOPE_URI
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top";
    private static final String EXTENSION_RESOURCE_TENANT_SCOPE_URI = "";
    private static final String EXTENSION_RESOURCE_NAME = "extension";
    private static final String EXTENSION_RESOURCE_TYPE = "Azure.ResourceManager.Resources/extensionsResources";
    private static final String EXTENSION_RESOURCE_BASE_ID
        = "/providers/Azure.ResourceManager.Resources/extensionsResources/extension";
    private final ResourcesManager manager
        = ResourcesManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());
    private final static ExtensionsResourceProperties CREATE_PROPERTIES
        = new ExtensionsResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID);
    private final static ExtensionsResourceProperties UPDATE_PROPERTIES
        = new ExtensionsResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2);
    private ExtensionsResource extensionResource;
    private List<ExtensionsResource> extensionResources;

    @Test
    public void testTenantExtensionResources() {
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_TENANT_SCOPE_URI)
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_BASE_ID, extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        ExtensionsResourceProperties properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_TENANT_SCOPE_URI)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_BASE_ID, extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource
            = manager.extensionsResources().get(EXTENSION_RESOURCE_TENANT_SCOPE_URI, EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_BASE_ID, extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // IllegalArgument Parameter resourceUri is required and cannot be null.
        // // Update
        // extensionResource.update().withProperties(updateProperties).apply();
        // Assertions.assertEquals(EXTENSION_RESOURCE_BASE_ID, extensionResource.id());
        // Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        // Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        // Assertions.assertNotNull(extensionResource.properties());
        // updateProperties = extensionResource.properties();
        // Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, updateProperties.description());
        // Assertions.assertEquals(ProvisioningState.SUCCEEDED, updateProperties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_TENANT_SCOPE_URI, EXTENSION_RESOURCE_NAME);
    }

    @Test
    public void testSubscriptionExtensionResources() {
        // resource url format: /subscriptions/00000000-0000-0000-0000-000000000000
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI)
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        ExtensionsResourceProperties properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource
            = manager.extensionsResources().get(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI, EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI, EXTENSION_RESOURCE_NAME);

        // resource url format: subscriptions/00000000-0000-0000-0000-000000000000
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI.substring(1))
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI.substring(1))
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource = manager.extensionsResources()
            .get(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_SUBSCRIPTION_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
    }

    @Test
    public void testResourceGroupExtensionResources() {
        // resource uri format: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI)
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        ExtensionsResourceProperties properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource
            = manager.extensionsResources().get(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI, EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI, EXTENSION_RESOURCE_NAME);

        // resource uri format: subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI.substring(1))
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource = manager.extensionsResources()
            .get(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_RESOURCE_GROUP_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
    }

    @Test
    public void testResourceExtensionResources() {
        // resource uri format:
        // /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI)
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        ExtensionsResourceProperties properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource
            = manager.extensionsResources().get(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI, EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI, EXTENSION_RESOURCE_NAME);

        // resource uri format:
        // subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top
        // Create
        extensionResource = manager.extensionsResources()
            .define(EXTENSION_RESOURCE_NAME)
            .withExistingResourceUri(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI.substring(1))
            .withProperties(CREATE_PROPERTIES)
            .create();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // List
        extensionResources = manager.extensionsResources()
            .listByScope(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI.substring(1))
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, extensionResources.size());
        extensionResource = extensionResources.get(0);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Get
        extensionResource = manager.extensionsResources()
            .get(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Update
        extensionResource.update().withProperties(UPDATE_PROPERTIES).apply();
        Assertions.assertEquals(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI + EXTENSION_RESOURCE_BASE_ID,
            extensionResource.id());
        Assertions.assertEquals(EXTENSION_RESOURCE_NAME, extensionResource.name());
        Assertions.assertEquals(EXTENSION_RESOURCE_TYPE, extensionResource.type());
        Assertions.assertNotNull(extensionResource.properties());
        properties = extensionResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());
        // Delete
        manager.extensionsResources()
            .deleteByResourceGroup(EXTENSION_RESOURCE_RESOURCE_SCOPE_URI.substring(1), EXTENSION_RESOURCE_NAME);
    }

    @Test
    public void testLocationResources() {
        LocationResourceProperties properties
            = new LocationResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID);
        LocationResource locationResource = manager.locationResources()
            .define(LOCATION_RESOURCE_NAME)
            .withExistingLocation(LOCATION_RESOURCE_LOCATION)
            .withProperties(properties)
            .create();
        Assertions.assertEquals(LOCATION_RESOURCE_ID, locationResource.id());
        Assertions.assertEquals(LOCATION_RESOURCE_NAME, locationResource.name());
        Assertions.assertEquals(LOCATION_RESOURCE_TYPE, locationResource.type());
        Assertions.assertNotNull(locationResource.properties());
        properties = locationResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());

        List<LocationResource> locationResources = manager.locationResources()
            .listByLocation(LOCATION_RESOURCE_LOCATION)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, locationResources.size());
        locationResource = locationResources.get(0);
        Assertions.assertEquals(LOCATION_RESOURCE_ID, locationResource.id());
        Assertions.assertEquals(LOCATION_RESOURCE_NAME, locationResource.name());
        Assertions.assertEquals(LOCATION_RESOURCE_TYPE, locationResource.type());
        Assertions.assertNotNull(locationResource.properties());
        properties = locationResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());

        locationResource = manager.locationResources().get(LOCATION_RESOURCE_LOCATION, LOCATION_RESOURCE_NAME);
        Assertions.assertEquals(LOCATION_RESOURCE_ID, locationResource.id());
        Assertions.assertEquals(LOCATION_RESOURCE_NAME, locationResource.name());
        Assertions.assertEquals(LOCATION_RESOURCE_TYPE, locationResource.type());
        Assertions.assertNotNull(locationResource.properties());
        properties = locationResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());

        properties = new LocationResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2);
        locationResource = locationResource.update().withProperties(properties).apply();
        Assertions.assertEquals(LOCATION_RESOURCE_ID, locationResource.id());
        Assertions.assertEquals(LOCATION_RESOURCE_NAME, locationResource.name());
        Assertions.assertEquals(LOCATION_RESOURCE_TYPE, locationResource.type());
        Assertions.assertNotNull(locationResource.properties());
        properties = locationResource.properties();
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, properties.description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, properties.provisioningState());

        manager.locationResources().deleteByResourceGroup(LOCATION_RESOURCE_LOCATION, LOCATION_RESOURCE_NAME);
    }

    @Test
    public void testTopLevelTrackedResource() {
        // TopLevelTrackedResources.createOrReplace
        TopLevelTrackedResource topLevelTrackedResource = manager.topLevels()
            .define(TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .withRegion(Region.US_EAST)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new TopLevelTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID))
            .create();
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        manager.topLevels()
            .actionSync(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME,
                new NotificationDetails().withMessage(NOTIFICATION_DETAILS_MESSAGE).withUrgent(true));

        topLevelTrackedResource
            .actionSync(new NotificationDetails().withMessage(NOTIFICATION_DETAILS_MESSAGE).withUrgent(true));

        // TopLevelTrackedResources.listByResourceGroup
        List<TopLevelTrackedResource> topLevelTrackedResourceList
            = manager.topLevels().listByResourceGroup(RESOURCE_GROUP_NAME).stream().collect(Collectors.toList());
        Assertions.assertEquals(1, topLevelTrackedResourceList.size());
        topLevelTrackedResource = topLevelTrackedResourceList.get(0);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.listBySubscription
        topLevelTrackedResourceList = manager.topLevels()
            .list()
            .stream()
            .filter(resource -> TOP_LEVEL_TRACKED_RESOURCE_ID.equals(resource.id()))
            .collect(Collectors.toList());
        Assertions.assertEquals(1, topLevelTrackedResourceList.size());
        topLevelTrackedResource = topLevelTrackedResourceList.get(0);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.get
        topLevelTrackedResource
            = manager.topLevels().getByResourceGroup(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.update
        topLevelTrackedResource.update()
            .withProperties(new TopLevelTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2))
            .apply();
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.delete
        manager.topLevels().delete(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, Context.NONE);
    }

    @Test
    public void testNestedProxyResource() {
        // NestedProxyResources.createOrReplace
        NestedProxyResource nestedProxyResource = manager.nesteds()
            .define(NESTED_PROXY_RESOURCE_NAME)
            .withExistingTopLevelTrackedResource(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .withProperties(new NestedProxyResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID))
            .create();
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.listByTopLevelTrackedResource
        List<NestedProxyResource> nestedProxyResourceList = manager.nesteds()
            .listByTopLevelTrackedResource(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, nestedProxyResourceList.size());
        nestedProxyResource = nestedProxyResourceList.get(0);
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.get
        nestedProxyResource
            = manager.nesteds().get(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, NESTED_PROXY_RESOURCE_NAME);
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.update
        nestedProxyResource.update()
            .withProperties(new NestedProxyResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2))
            .apply();
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.delete
        manager.nesteds().delete(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, NESTED_PROXY_RESOURCE_NAME);
    }

    @Test
    public void testSingletonResource() {
        final String resourceNameDefault = "default";

        SingletonTrackedResource resource = manager.singletons()
            .createOrUpdate(RESOURCE_GROUP_NAME,
                new SingletonTrackedResourceInner().withLocation(TOP_LEVEL_TRACKED_RESOURCE_REGION.name())
                    .withProperties(
                        new SingletonTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID)));
        Assertions.assertEquals(resourceNameDefault, resource.name());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, resource.properties().description());

        resource = manager.singletons()
            // TODO location should not be in PATCH
            .update(RESOURCE_GROUP_NAME, new SingletonTrackedResourceInner().withLocation(Region.US_EAST2.name())
                .withProperties(new SingletonTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2)));
        Assertions.assertEquals(resourceNameDefault, resource.name());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, resource.properties().description());

        resource = manager.singletons().getByResourceGroup(RESOURCE_GROUP_NAME);
        Assertions.assertEquals(resourceNameDefault, resource.name());

        resource = manager.singletons().listByResourceGroup(RESOURCE_GROUP_NAME).stream().findFirst().get();
        Assertions.assertEquals(resourceNameDefault, resource.name());
    }
}
