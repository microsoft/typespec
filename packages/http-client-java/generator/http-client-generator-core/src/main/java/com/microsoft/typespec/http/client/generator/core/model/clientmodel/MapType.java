// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Set;

/**
 * A map type used by a client.
 */
public class MapType extends GenericType {

    private boolean valueNullable = false;

    /**
     * Create a new MapType from the provided properties.
     * @param valueType The type of values that are stored in this dictionary.
     */
    public MapType(IType valueType) {
        this(valueType, false);
    }

    public MapType(IType valueType, boolean valueNullable) {
        super("java.util", "Map", "JsonToken.START_ARRAY", ClassType.STRING, valueType);
        this.valueNullable = valueNullable;
    }

    /**
     * The type of values that are stored in this map.
     */
    public final IType getValueType() {
        return getTypeArguments()[1];
    }

    public boolean isValueNullable() {
        return valueNullable;
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        super.addImportsTo(imports, includeImplementationImports);
    }

    @Override
    public String validate(String expression) {
        return validate(expression, 0);
    }

    @Override
    public String validate(String expression, int depth) {
        String var = depth == 0 ? "e" : "e" + depth;
        String elementValidation = getValueType() instanceof GenericType
                ? ((GenericType) getValueType()).validate(var, ++depth)
                : getValueType().validate(var);
        if (elementValidation != null) {
            return String.format("%s.values().forEach(%s -> { if (%s != null) { %s; } })", expression, var, var, elementValidation);
        } else {
            return null;
        }
    }
}
