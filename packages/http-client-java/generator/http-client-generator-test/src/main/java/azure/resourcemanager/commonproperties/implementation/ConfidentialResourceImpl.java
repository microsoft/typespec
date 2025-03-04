// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.resourcemanager.commonproperties.implementation;

import azure.resourcemanager.commonproperties.fluent.models.ConfidentialResourceInner;
import azure.resourcemanager.commonproperties.models.ConfidentialResource;
import azure.resourcemanager.commonproperties.models.ConfidentialResourceProperties;
import com.azure.core.management.Region;
import com.azure.core.management.SystemData;
import com.azure.core.util.Context;
import java.util.Collections;
import java.util.Map;

public final class ConfidentialResourceImpl implements ConfidentialResource, ConfidentialResource.Definition {
    private ConfidentialResourceInner innerObject;

    private final azure.resourcemanager.commonproperties.CommonPropertiesManager serviceManager;

    ConfidentialResourceImpl(ConfidentialResourceInner innerObject,
        azure.resourcemanager.commonproperties.CommonPropertiesManager serviceManager) {
        this.innerObject = innerObject;
        this.serviceManager = serviceManager;
    }

    public String id() {
        return this.innerModel().id();
    }

    public String name() {
        return this.innerModel().name();
    }

    public String type() {
        return this.innerModel().type();
    }

    public String location() {
        return this.innerModel().location();
    }

    public Map<String, String> tags() {
        Map<String, String> inner = this.innerModel().tags();
        if (inner != null) {
            return Collections.unmodifiableMap(inner);
        } else {
            return Collections.emptyMap();
        }
    }

    public ConfidentialResourceProperties properties() {
        return this.innerModel().properties();
    }

    public SystemData systemData() {
        return this.innerModel().systemData();
    }

    public Region region() {
        return Region.fromName(this.regionName());
    }

    public String regionName() {
        return this.location();
    }

    public ConfidentialResourceInner innerModel() {
        return this.innerObject;
    }

    private azure.resourcemanager.commonproperties.CommonPropertiesManager manager() {
        return this.serviceManager;
    }

    private String resourceGroupName;

    private String confidentialResourceName;

    public ConfidentialResourceImpl withExistingResourceGroup(String resourceGroupName) {
        this.resourceGroupName = resourceGroupName;
        return this;
    }

    public ConfidentialResource create() {
        this.innerObject = serviceManager.serviceClient()
            .getErrors()
            .createOrReplaceWithResponse(resourceGroupName, confidentialResourceName, this.innerModel(), Context.NONE)
            .getValue();
        return this;
    }

    public ConfidentialResource create(Context context) {
        this.innerObject = serviceManager.serviceClient()
            .getErrors()
            .createOrReplaceWithResponse(resourceGroupName, confidentialResourceName, this.innerModel(), context)
            .getValue();
        return this;
    }

    ConfidentialResourceImpl(String name,
        azure.resourcemanager.commonproperties.CommonPropertiesManager serviceManager) {
        this.innerObject = new ConfidentialResourceInner();
        this.serviceManager = serviceManager;
        this.confidentialResourceName = name;
    }

    public ConfidentialResource refresh() {
        this.innerObject = serviceManager.serviceClient()
            .getErrors()
            .getByResourceGroupWithResponse(resourceGroupName, confidentialResourceName, Context.NONE)
            .getValue();
        return this;
    }

    public ConfidentialResource refresh(Context context) {
        this.innerObject = serviceManager.serviceClient()
            .getErrors()
            .getByResourceGroupWithResponse(resourceGroupName, confidentialResourceName, context)
            .getValue();
        return this;
    }

    public ConfidentialResourceImpl withRegion(Region location) {
        this.innerModel().withLocation(location.toString());
        return this;
    }

    public ConfidentialResourceImpl withRegion(String location) {
        this.innerModel().withLocation(location);
        return this;
    }

    public ConfidentialResourceImpl withTags(Map<String, String> tags) {
        this.innerModel().withTags(tags);
        return this;
    }

    public ConfidentialResourceImpl withProperties(ConfidentialResourceProperties properties) {
        this.innerModel().withProperties(properties);
        return this;
    }
}
