// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ClientModelPropertyReference implements ClientModelPropertyAccess {

    /*
    Usage of the ClientModelPropertyReference
    1. Reference to property (or propertyReference) from superclass, which has non-null referenceProperty, i.e., super.referenceProperty
    2. Reference to property from a flattened client model (targetModel), which has non-null referenceProperty and targetProperty, i.e., targetProperty.referenceProperty

    This could be recursive, as
     */

    private final String name;
    private final ClientModelPropertyAccess referenceProperty;
    private final ClientModel targetModel;
    private final ClientModelProperty targetProperty;

    private ClientModelPropertyReference(ClientModelProperty targetProperty, ClientModel targetModel,
        ClientModelPropertyAccess referenceProperty, String name) {
        this.targetProperty = targetProperty;
        this.targetModel = targetModel;
        this.referenceProperty = referenceProperty;
        this.name = name;
    }

    public static ClientModelPropertyReference ofParentProperty(ClientModelProperty property) {
        return new ClientModelPropertyReference(null, null, property, null);
    }

    public static ClientModelPropertyReference ofParentProperty(ClientModelPropertyReference referenceProperty) {
        if (!referenceProperty.isFromFlattenedProperty()) {
            throw new IllegalArgumentException("Property is not from flattened model: " + referenceProperty.getName());
        }
        return new ClientModelPropertyReference(null, null, referenceProperty, null);
    }

    public static ClientModelPropertyReference ofFlattenProperty(ClientModelProperty targetProperty,
        ClientModel targetModel, ClientModelProperty property, String name) {
        return new ClientModelPropertyReference(targetProperty, targetModel, property, name);
    }

    public static ClientModelPropertyReference ofFlattenProperty(ClientModelProperty targetProperty,
        ClientModel targetModel, ClientModelPropertyReference referenceProperty, String name) {
        if (!referenceProperty.isFromFlattenedProperty()) {
            throw new IllegalArgumentException("Property is not from flattened model: " + referenceProperty.getName());
        }
        return new ClientModelPropertyReference(targetProperty, targetModel, referenceProperty, name);
    }

    public boolean isFromFlattenedProperty() {
        return this.targetProperty != null;
    }

    public boolean isFromParentModel() {
        return this.targetProperty == null;
    }

    public ClientModelPropertyAccess getReferenceProperty() {
        return referenceProperty;
    }

    public ClientModelProperty getTargetProperty() {
        return targetProperty;
    }

    public List<ClientModelProperty> getAllProperties() {
        List<ClientModelProperty> properties = new ArrayList<>();
        if (targetProperty != null) {
            properties.add(targetProperty);
        }
        if (referenceProperty instanceof ClientModelProperty) {
            properties.add((ClientModelProperty) referenceProperty);
        } else if (referenceProperty instanceof ClientModelPropertyReference) {
            properties.addAll(((ClientModelPropertyReference) referenceProperty).getAllProperties());
        } else {
            throw new IllegalStateException(
                "Unknown subclass of ClientModelPropertyAccess: " + referenceProperty.getClass().getName());
        }
        return properties;
    }

    public IType getTargetModelType() {
        return targetModel.getType();
    }

    @Override
    public String getName() {
        return this.name == null ? this.referenceProperty.getName() : this.name;
    }

    @Override
    public String getDescription() {
        return referenceProperty.getDescription();
    }

    @Override
    public String getGetterName() {
        return CodeNamer.getModelNamer()
            .modelPropertyGetterName(this.referenceProperty.getClientType(), this.getName());
    }

    @Override
    public String getSetterName() {
        return CodeNamer.getModelNamer().modelPropertySetterName(this.getName());
    }

    @Override
    public IType getClientType() {
        return referenceProperty.getClientType();
    }

    @Override
    public IType getWireType() {
        return referenceProperty.getWireType();
    }

    @Override
    public boolean isReadOnly() {
        return (targetProperty != null && targetProperty.isReadOnly()) || referenceProperty.isReadOnly();
    }

    @Override
    public boolean isReadOnlyForCreate() {
        return (targetProperty != null && targetProperty.isReadOnly()) || referenceProperty.isReadOnlyForCreate();
    }

    @Override
    public boolean isReadOnlyForUpdate() {
        return (targetProperty != null && targetProperty.isReadOnly()) || referenceProperty.isReadOnlyForUpdate();
    }

    @Override
    public boolean isRequired() {
        return (targetProperty == null || targetProperty.isRequired()) && referenceProperty.isRequired();
    }

    @Override
    public boolean isRequiredForCreate() {
        return (targetProperty == null || targetProperty.isRequiredForCreate())
            && referenceProperty.isRequiredForCreate();
    }

    @Override
    public boolean isConstant() {
        // could we have the whole flattened model as constant?
        return referenceProperty.isConstant();
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean shouldGenerateXmlSerialization) {
        referenceProperty.addImportsTo(imports, shouldGenerateXmlSerialization);
    }
}
