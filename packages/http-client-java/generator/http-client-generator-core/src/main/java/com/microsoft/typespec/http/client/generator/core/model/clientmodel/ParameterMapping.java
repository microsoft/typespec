// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A type holding the mappings derived from the transformations (e.g. group-by, body spreading) applied on parameter.
 */
public final class ParameterMapping {
    private final ClientMethodParameter inParameter;
    private final ClientModelProperty inParameterProperty;
    private final ClientMethodParameter outParameter;
    private final ClientModelProperty outParameterProperty;
    private final String outParameterPropertyName;

    public ParameterMapping(ClientMethodParameter inParameter, ClientModelProperty inParameterProperty,
        ClientMethodParameter outParameter, ClientModelProperty outParameterProperty, String outParameterPropertyName) {
        this.inParameter = inParameter;
        this.inParameterProperty = inParameterProperty;
        this.outParameter = outParameter;
        this.outParameterProperty = outParameterProperty;
        this.outParameterPropertyName = outParameterPropertyName;
    }

    /**
     * Gets the description of an "input parameter" that SDK Method takes.
     *
     * @return the in parameter.
     */
    public ClientMethodParameter getInParameter() {
        return inParameter;
    }

    /**
     * Gets the property within the "input parameter" model ({@link #getInParameter()}). When calling service,
     * this property's value is read from the "input parameter" model and transmitted. A non-null value from this
     * getter indicates spec requested a flattening transformation (group-by) of the SDK Method input to its
     * properties for the purpose of wire call.
     *
     * @return the property.
     */
    public ClientModelProperty getInParameterProperty() {
        return inParameterProperty;
    }

    /**
     * Gets description of the "output parameter" that is transmitted to the service.
     *
     * @return the out parameter.
     */
    public ClientMethodParameter getOutParameter() {
        return outParameter;
    }

    /**
     * Gets description of the property within the "output parameter" model ({@link #getOutParameter()}), where its
     * value is populated from an SDK Method argument. A non-null value from this indicates spec requested the
     * spreading transformation of operation parameter to SDK method arguments.
     * <p>
     * E.g, spec has 'op add(...User): void' and the SDK method will look like 'void add(String name, int age)',
     * i.e., properties of the 'User' model ("output parameter") are spread into the SDK method arguments.
     * </p>
     *
     * @return the property.
     */
    public ClientModelProperty getOutParameterProperty() {
        return outParameterProperty;
    }

    /**
     * Gets the name of the property {@link #getOutParameterProperty()} in the "output parameter" model.
     *
     * @return the name of the property.
     */
    public String getOutParameterPropertyName() {
        return outParameterPropertyName;
    }
}
