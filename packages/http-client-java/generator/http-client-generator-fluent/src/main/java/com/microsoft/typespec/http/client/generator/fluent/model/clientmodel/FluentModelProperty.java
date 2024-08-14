// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.model.clientmodel;

import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.immutablemodel.PropertyTemplate;
import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.immutablemodel.PropertyTypeConversionTemplate;
import com.microsoft.typespec.http.client.generator.fluent.util.FluentUtils;
import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.ClientModelPropertyAccess;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.model.clientmodel.ListType;
import com.azure.autorest.model.clientmodel.MapType;
import com.azure.autorest.model.clientmodel.ModelProperty;
import com.azure.autorest.template.prototype.MethodTemplate;

import java.util.Set;

public class FluentModelProperty {

    private final ModelProperty modelProperty;

    private final IType fluentType;

    private final ImmutableMethod immutableMethod;

    public FluentModelProperty(ClientModelPropertyAccess property) {
        this.modelProperty = ModelProperty.ofClientModelProperty(property);
        this.fluentType = getWrapperType(property.getClientType());
        this.immutableMethod = this.fluentType == property.getClientType()
                ? new PropertyTemplate(this, this.modelProperty)
                : new PropertyTypeConversionTemplate(this, this.modelProperty);
    }

    public String getName() {
        return modelProperty.getName();
    }

    public String getDescription() {
        return modelProperty.getDescription();
    }

    public IType getFluentType() {
        return fluentType;
    }

    // method signature for model property
    public String getMethodSignature() {
        return String.format("%1$s %2$s()", this.getFluentType(), this.getGetterName());
    }

    public String getMethodName() {
        return this.getGetterName();
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        this.fluentType.addImportsTo(imports, false);

        if (includeImplementationImports) {
            this.immutableMethod.getMethodTemplate().addImportsTo(imports);
        }
    }

    public MethodTemplate getImplementationMethodTemplate() {
        return immutableMethod.getMethodTemplate();
    }

    private String getGetterName() {
        return modelProperty.getGetterName();
    }

    private static IType getWrapperType(IType clientType) {
        IType wrapperType = clientType;
        if (clientType instanceof ClassType) {
            ClassType type = (ClassType) clientType;
            if (FluentUtils.isInnerClassType(type)) {
                wrapperType = FluentUtils.resourceModelInterfaceClassType(type);
            }
        } else if (clientType instanceof ListType) {
            ListType type = (ListType) clientType;
            IType wrapperElementType = getWrapperType(type.getElementType());
            wrapperType = wrapperElementType == type.getElementType() ? type : new ListType(wrapperElementType);
        } else if (clientType instanceof MapType) {
            MapType type = (MapType) clientType;
            IType wrapperElementType = getWrapperType(type.getValueType());
            wrapperType = wrapperElementType == type.getValueType() ? type : new MapType(wrapperElementType);
        }
        return wrapperType;
    }

    public ModelProperty getModelProperty() {
        return modelProperty;
    }
}
