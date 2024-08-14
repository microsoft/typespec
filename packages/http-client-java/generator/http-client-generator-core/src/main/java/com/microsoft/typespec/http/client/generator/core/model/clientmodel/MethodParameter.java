// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;

/**
 * The base type for method parameters.
 */
public abstract class MethodParameter {
    /**
     * Get the description of this parameter.
     */
    private final String description;
    /**
     * The wire type of this parameter.
     */
    private final IType wireType;
    /**
     * The raw type of this parameter. Result of SchemaMapper.
     */
    private final IType rawType;
    /**
     * The client type of this parameter.
     */
    private final IType clientType;
    /**
     * The name of this parameter.
     */
    private final String name;
    /**
     * Get the location within the REST API method's URL where this parameter will be added.
     */
    private final RequestParameterLocation requestParameterLocation;
    /**
     * Whether this parameter is a constant value.
     */
    private final boolean isConstant;
    /**
     * Whether this parameter is required.
     */
    private final boolean isRequired;
    /**
     * Whether this parameter's value comes from a ServiceClientProperty.
     */
    private final boolean fromClient;
    /**
     * Get the default value of this parameter.
     */
    private final String defaultValue;

    /**
     * Creates a new instance of {@link MethodParameter}.
     *
     * @param description The description of the parameter.
     * @param wireType The wire type of the parameter.
     * @param rawType The raw type of the parameter.
     * @param clientType The client type of the parameter
     * @param name The name of the parameter.
     * @param requestParameterLocation The location within a REST API method's URL where this parameter will be added.
     * @param isConstant Whether the parameter is a constant value.
     * @param isRequired Whether the parameter is required.
     * @param fromClient Whether the parameter;s value comes from a ServiceClientProperty.
     * @param defaultValue The default value of the parameter.
     */
    protected MethodParameter(String description, IType wireType, IType rawType, IType clientType, String name,
        RequestParameterLocation requestParameterLocation, boolean isConstant, boolean isRequired, boolean fromClient,
        String defaultValue) {
        this.description = description;
        this.wireType = wireType;
        this.rawType = rawType;
        this.clientType = clientType;
        this.name = name;
        this.requestParameterLocation = requestParameterLocation;
        this.isConstant = isConstant;
        this.isRequired = isRequired;
        this.fromClient = fromClient;
        this.defaultValue = defaultValue;
    }

    /**
     * Gets the description of this parameter.
     *
     * @return The description of this parameter.
     */
    public final String getDescription() {
        return description;
    }

    /**
     * Gets the wire type of this parameter.
     *
     * @return The wire type of this parameter.
     */
    public final IType getWireType() {
        return wireType;
    }

    /**
     * Gets the raw type of this parameter. Result of SchemaMapper.
     *
     * @return The raw type of this parameter, result of SchemaMapper.
     */
    public final IType getRawType() {
        return rawType;
    }

    /**
     * Gets the client type of this parameter.
     *
     * @return The client type of this parameter.
     */
    public final IType getClientType() {
        return clientType;
    }

    /**
     * Gets the name of this parameter.
     *
     * @return The name of this parameter.
     */
    public final String getName() {
        return name;
    }

    /**
     * Gets the location within the REST API method's URL where this parameter will be added.
     *
     * @return The location within the REST API method's URL where this parameter will be added.
     */
    public final RequestParameterLocation getRequestParameterLocation() {
        return requestParameterLocation;
    }

    /**
     * Gets whether this parameter is a constant value.
     *
     * @return Whether this parameter is a constant value.
     */
    public final boolean isConstant() {
        return isConstant;
    }

    /**
     * Gets whether this parameter is required.
     *
     * @return Whether this parameter is required.
     */
    public final boolean isRequired() {
        return isRequired;
    }

    /**
     * Gets whether this parameter's value comes from a ServiceClientProperty.
     *
     * @return Whether this parameter's value comes from a ServiceClientProperty.
     */
    public final boolean isFromClient() {
        return fromClient;
    }

    /**
     * Gets the default value of this parameter.
     *
     * @return The default value of this parameter.
     */
    public final String getDefaultValue() {
        return defaultValue;
    }
}
