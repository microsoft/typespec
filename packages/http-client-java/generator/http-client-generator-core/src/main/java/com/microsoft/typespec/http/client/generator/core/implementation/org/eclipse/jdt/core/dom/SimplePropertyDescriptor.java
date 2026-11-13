// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2013 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

/**
 * Descriptor for a simple property of an AST node. A simple property is one whose value is a primitive type (such as
 * <code>int</code> or <code>boolean</code>) or some simple value type (such as <code>String</code> or
 * <code>InfixExpression.Operator</code>).
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public final class SimplePropertyDescriptor extends StructuralPropertyDescriptor {

    /**
     * Creates a new simple property descriptor with the given property id. Note that this constructor is declared
     * package-private so that property descriptors can only be created by the AST implementation.
     *
     * @param nodeClass concrete AST node type that owns this property
     * @param propertyId the property id
     * @param valueType the value type of this property
     */
    SimplePropertyDescriptor(Class nodeClass, String propertyId, Class valueType) {
        super(nodeClass, propertyId);
        if (valueType == null || ASTNode.class.isAssignableFrom(valueType)) {
            throw new IllegalArgumentException();
        }
    }
}
