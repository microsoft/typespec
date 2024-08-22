// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class ModelProperty {

    private final ClientModelPropertyAccess property;

    private ModelProperty(ClientModelPropertyAccess property) {
        this.property = property;
    }

    public static ModelProperty ofClientModelProperty(ClientModelPropertyAccess property) {
        return new ModelProperty(property);
    }

    public String getGetterName() {
        return property.getGetterName();
    }

    public String getSetterName() {
        return property.getSetterName();
    }

    public void addImportsTo(Set<String> imports) {
        property.addImportsTo(imports, false);
    }

    public String getName() {
        return property.getName();
    }

    public String getDescription() {
        return property.getDescription();
    }

    public IType getClientType() {
        return property.getClientType();
    }

    public IType getWireType() {
        return property.getWireType();
    }

    public boolean isRequired() {
        return property.isRequired();
    }

    public boolean isConstant() {
        return property.isConstant();
    }

    public boolean isReadOnly() {
        return property.isReadOnly();
    }

    public boolean isReadOnlyForCreate() {
        return property.isReadOnlyForCreate();
    }

    public boolean isReadOnlyForUpdate() {
        return property.isReadOnlyForUpdate();
    }

    public String getSerializedName() {
        if (property instanceof ClientModelProperty) {
            return ((ClientModelProperty) property).getSerializedName();
        } else if (property instanceof ClientModelPropertyReference) {
            return ((ClientModelPropertyReference) property).getAllProperties().stream()
                    .map(ClientModelProperty::getSerializedName)
                    .map(s -> s.replace(".", "\\\\."))
                    .collect(Collectors.joining("."));
        } else {
            throw new IllegalStateException("Unknown subclass of ClientModelPropertyAccess: " + property.getClass().getName());
        }
    }

    public List<String> getSerializedNames() {
        if (property instanceof ClientModelProperty) {
            ClientModelProperty clientModelProperty = (ClientModelProperty) property;
            if (!clientModelProperty.getNeedsFlatten()) {
                return ClientModelUtil.splitFlattenedSerializedName(clientModelProperty.getSerializedName());
            } else {
                return Collections.singletonList(clientModelProperty.getSerializedName());
            }
        } else if (property instanceof ClientModelPropertyReference) {
            return ((ClientModelPropertyReference) property).getAllProperties().stream()
                    .map(ClientModelProperty::getSerializedName)
                    .collect(Collectors.toList());
        } else {
            throw new IllegalStateException("Unknown subclass of ClientModelPropertyAccess: " + property.getClass().getName());
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ModelProperty that = (ModelProperty) o;
        return Objects.equals(property, that.property);
    }

    @Override
    public int hashCode() {
        return Objects.hash(property);
    }
}
