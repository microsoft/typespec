// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

/**
 * Class variable or local variable.
 */
public class LocalVariable {
    private final String name;
    private final IType variableType;
    private final ClientMethodParameter methodParameterReference;
    private final RequestParameterLocation parameterLocation;
    private boolean initializeRequired = false;
    private String initializeExpression;

    public LocalVariable(String name, IType variableType, RequestParameterLocation parameterLocation, ClientMethodParameter methodParameterReference) {
        this.name = name;
        this.variableType = variableType;
        this.parameterLocation = parameterLocation;
        this.methodParameterReference = methodParameterReference;
    }

    public String getName() {
        return name;
    }

    public IType getVariableType() {
        return variableType;
    }

    public RequestParameterLocation getParameterLocation() {
        return parameterLocation;
    }

    public ClientMethodParameter getMethodParameterReference() {
        return methodParameterReference;
    }

    public boolean isInitializeRequired() {
        return initializeRequired;
    }

    public String getInitializeExpression() {
        return initializeExpression;
    }

    public void setInitializeExpression(String initializeExpression) {
        this.initializeRequired = true;
        this.initializeExpression = initializeExpression;
    }

    public LocalVariable getRenameLocalVariable(String newName) {
        return new LocalVariable(newName, this.getVariableType(), this.getParameterLocation(), this.getMethodParameterReference());
    }
}
