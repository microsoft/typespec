// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armresourceprovider.implementation;

import com.azure.core.management.SystemData;
import com.azure.core.util.Context;
import tsptest.armresourceprovider.fluent.models.ChildExtensionResourceInner;
import tsptest.armresourceprovider.models.ChildExtensionResource;
import tsptest.armresourceprovider.models.ChildExtensionResourceProperties;
import tsptest.armresourceprovider.models.ChildExtensionResourceUpdate;

public final class ChildExtensionResourceImpl
    implements ChildExtensionResource, ChildExtensionResource.Definition, ChildExtensionResource.Update {
    private ChildExtensionResourceInner innerObject;

    private final tsptest.armresourceprovider.ArmResourceProviderManager serviceManager;

    public String id() {
        return this.innerModel().id();
    }

    public String name() {
        return this.innerModel().name();
    }

    public String type() {
        return this.innerModel().type();
    }

    public ChildExtensionResourceProperties properties() {
        return this.innerModel().properties();
    }

    public SystemData systemData() {
        return this.innerModel().systemData();
    }

    public ChildExtensionResourceInner innerModel() {
        return this.innerObject;
    }

    private tsptest.armresourceprovider.ArmResourceProviderManager manager() {
        return this.serviceManager;
    }

    private String resourceUri;

    private String topLevelArmResourceName;

    private String childExtensionResourceName;

    private ChildExtensionResourceUpdate updateProperties;

    public ChildExtensionResourceImpl withExistingTopLevelArmResource(String resourceUri,
        String topLevelArmResourceName) {
        this.resourceUri = resourceUri;
        this.topLevelArmResourceName = topLevelArmResourceName;
        return this;
    }

    public ChildExtensionResource create() {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .createOrUpdate(resourceUri, topLevelArmResourceName, childExtensionResourceName, this.innerModel(),
                Context.NONE);
        return this;
    }

    public ChildExtensionResource create(Context context) {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .createOrUpdate(resourceUri, topLevelArmResourceName, childExtensionResourceName, this.innerModel(),
                context);
        return this;
    }

    ChildExtensionResourceImpl(String name, tsptest.armresourceprovider.ArmResourceProviderManager serviceManager) {
        this.innerObject = new ChildExtensionResourceInner();
        this.serviceManager = serviceManager;
        this.childExtensionResourceName = name;
    }

    public ChildExtensionResourceImpl update() {
        this.updateProperties = new ChildExtensionResourceUpdate();
        return this;
    }

    public ChildExtensionResource apply() {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .updateWithResponse(resourceUri, topLevelArmResourceName, childExtensionResourceName, updateProperties,
                Context.NONE)
            .getValue();
        return this;
    }

    public ChildExtensionResource apply(Context context) {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .updateWithResponse(resourceUri, topLevelArmResourceName, childExtensionResourceName, updateProperties,
                context)
            .getValue();
        return this;
    }

    ChildExtensionResourceImpl(ChildExtensionResourceInner innerObject,
        tsptest.armresourceprovider.ArmResourceProviderManager serviceManager) {
        this.innerObject = innerObject;
        this.serviceManager = serviceManager;
        this.resourceUri = ResourceManagerUtils.getValueFromIdByParameterName(innerObject.id(),
            "/{resourceUri}/providers/TspTest.ArmResourceProvider/topLevelArmResources/{topLevelArmResourceName}/childExtensionResources/{childExtensionResourceName}",
            "resourceUri");
        this.topLevelArmResourceName = ResourceManagerUtils.getValueFromIdByParameterName(innerObject.id(),
            "/{resourceUri}/providers/TspTest.ArmResourceProvider/topLevelArmResources/{topLevelArmResourceName}/childExtensionResources/{childExtensionResourceName}",
            "topLevelArmResourceName");
        this.childExtensionResourceName = ResourceManagerUtils.getValueFromIdByParameterName(innerObject.id(),
            "/{resourceUri}/providers/TspTest.ArmResourceProvider/topLevelArmResources/{topLevelArmResourceName}/childExtensionResources/{childExtensionResourceName}",
            "childExtensionResourceName");
    }

    public ChildExtensionResource refresh() {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .getWithResponse(resourceUri, topLevelArmResourceName, childExtensionResourceName, Context.NONE)
            .getValue();
        return this;
    }

    public ChildExtensionResource refresh(Context context) {
        this.innerObject = serviceManager.serviceClient()
            .getChildExtensionResourceInterfaces()
            .getWithResponse(resourceUri, topLevelArmResourceName, childExtensionResourceName, context)
            .getValue();
        return this;
    }

    public ChildExtensionResourceImpl withProperties(ChildExtensionResourceProperties properties) {
        this.innerModel().withProperties(properties);
        return this;
    }
}
