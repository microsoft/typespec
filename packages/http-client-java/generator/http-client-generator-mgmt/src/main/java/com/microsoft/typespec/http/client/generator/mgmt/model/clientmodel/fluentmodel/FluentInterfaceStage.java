// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class FluentInterfaceStage {

    protected final String name;
    protected FluentInterfaceStage nextStage;
    protected String extendStages;
    protected ModelProperty property;
    protected ClientMethodParameter parameter;

    protected final List<FluentMethod> methods = new ArrayList<>();

    protected FluentInterfaceStage(String name) {
        this.name = name;
    }

    protected FluentInterfaceStage(String name, ModelProperty property) {
        this.name = name;
        this.property = property;
    }

    protected FluentInterfaceStage(String name, ClientMethodParameter parameter) {
        this.name = name;
        this.parameter = parameter;
    }

    public String getName() {
        return name;
    }

    public boolean isMandatoryStage() {
        return (parameter == null) && (property == null || property.isRequired());
    }

    public FluentInterfaceStage getNextStage() {
        return nextStage;
    }

    public void setNextStage(FluentInterfaceStage nextStage) {
        this.nextStage = nextStage;
    }

    public String getExtendStages() {
        return extendStages;
    }

    public void setExtendStages(String extendStages) {
        this.extendStages = extendStages;
    }

    public List<FluentMethod> getMethods() {
        return methods;
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        this.getMethods().forEach(m -> m.addImportsTo(imports, includeImplementationImports));
    }
}
