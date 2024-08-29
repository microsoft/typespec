// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public class ParameterMapping {
    private ClientMethodParameter inputParameter;

    private ClientModelProperty inputParameterProperty;

    private String outputParameterPropertyName;

    private ClientModelProperty outputParameterProperty;

    public ClientMethodParameter getInputParameter() {
        return inputParameter;
    }

    public ParameterMapping setInputParameter(ClientMethodParameter inputParameter) {
        this.inputParameter = inputParameter;
        return this;
    }

    public ClientModelProperty getInputParameterProperty() {
        return inputParameterProperty;
    }

    public ParameterMapping setInputParameterProperty(ClientModelProperty inputParameterProperty) {
        this.inputParameterProperty = inputParameterProperty;
        return this;
    }

    public String getOutputParameterPropertyName() {
        return outputParameterPropertyName;
    }

    public ParameterMapping setOutputParameterPropertyName(String outputParameterPropertyName) {
        this.outputParameterPropertyName = outputParameterPropertyName;
        return this;
    }

    public ClientModelProperty getOutputParameterProperty() {
        return outputParameterProperty;
    }

    public ParameterMapping setOutputParameterProperty(ClientModelProperty outputParameterProperty) {
        this.outputParameterProperty = outputParameterProperty;
        return this;
    }
}
