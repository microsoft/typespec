// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import java.util.HashSet;
import java.util.Set;

public abstract class TypeModel extends ModelBase {
    private Set<Property> properties;
    private TypeModel baseType;
    private String discriminatorName;
    private String discriminatorValue;
    private boolean fromExpression;
    private Specification spec;

    protected TypeModel(Specification spec, ClientModel armType, String name, String ns, String description) {
        super(name, ns, armType, description);
        this.spec = spec;
        this.properties = new HashSet<>();
        this.baseType = null;
        this.discriminatorName = null;
        this.discriminatorValue = null;
        this.fromExpression = false;
        TypeRegistry.register(this);
    }

    protected Set<String> collectNamespaces() {
        Set<String> namespaces
            = TypeRegistry.collectNamespaces(properties.stream().map(p -> p.getPropertyType()).toList());
        namespaces.add("com.azure.provisioning.primitives");
        namespaces.remove(getProvisioningPackage());
        return namespaces;
    }

    @Override
    public void lint() {
        super.lint();
        if (discriminatorName != null && discriminatorValue == null) {
            warn(getTypeReference() + " has a " + "discriminatorName" + " but no " + "discriminatorValue" + ".");
        }
        for (Property property : properties) {
            // Additional linting logic for properties
        }
    }

    // Getters and setters for properties
    public Set<Property> getProperties() {
        return properties;
    }

    public void setProperties(Set<Property> properties) {
        this.properties = properties;
    }

    public TypeModel getBaseType() {
        return baseType;
    }

    public void setBaseType(TypeModel baseType) {
        this.baseType = baseType;
    }

    public String getDiscriminatorName() {
        return discriminatorName;
    }

    public void setDiscriminatorName(String discriminatorName) {
        this.discriminatorName = discriminatorName;
    }

    public String getDiscriminatorValue() {
        return discriminatorValue;
    }

    public void setDiscriminatorValue(String discriminatorValue) {
        this.discriminatorValue = discriminatorValue;
    }

    public boolean isFromExpression() {
        return fromExpression;
    }

    public void setFromExpression(boolean fromExpression) {
        this.fromExpression = fromExpression;
    }

    public Specification getSpec() {
        return spec;
    }

    public void setSpec(Specification spec) {
        this.spec = spec;
    }
}
