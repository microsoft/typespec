// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;


import java.util.Set;

public class IterableType extends GenericType {
    /**
     * Create a new IterableType from the provided properties.
     * @param elementType The type of elements that are stored in this sequence.
     */
    public IterableType(IType elementType) {
        super("java.lang", "Iterable", "JsonToken.START_ARRAY", elementType);
    }

    IterableType(String packageName, String className, IType elementType) {
        super(packageName, className, "JsonToken.START_ARRAY", elementType);
    }

    /**
     * The type of elements that are stored in this iterable.
     */
    public final IType getElementType() {
        return getTypeArguments()[0];
    }

    @Override
    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        super.addImportsTo(imports, includeImplementationImports);
    }

    @Override
    public final String validate(String expression) {
        return validate(expression, 0);
    }

    @Override
    public final String validate(String expression, int depth) {
        String var = depth == 0 ? "e" : "e" + depth;
        String elementValidation = getElementType() instanceof GenericType
                ? ((GenericType) getElementType()).validate(var, depth + 1)
                : getElementType().validate(var);
        if (elementValidation != null) {
            return String.format("%s.forEach(%s -> %s)", expression, var, elementValidation);
        } else {
            return null;
        }
    }
}
