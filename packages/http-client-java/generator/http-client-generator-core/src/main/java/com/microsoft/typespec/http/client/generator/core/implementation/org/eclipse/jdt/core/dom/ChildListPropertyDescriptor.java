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
 * Descriptor for a child list property of an AST node. A child list property is one whose value is a list of
 * {@link ASTNode}.
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public final class ChildListPropertyDescriptor extends StructuralPropertyDescriptor {

    /**
     * Element type. For example, for a node type like CompilationUnit, the "imports" property is
     * ImportDeclaration.class. <p> Field is private, but marked package-visible for fast access from ASTNode. </p>
     */
    final Class elementType;

    /**
     * Indicates whether a cycle is possible. <p> Field is private, but marked package-visible for fast access from
     * ASTNode. </p>
     */
    final boolean cycleRisk;

    /**
     * Creates a new child list property descriptor with the given property id. Note that this constructor is declared
     * package-private so that property descriptors can only be created by the AST implementation.
     *
     * @param nodeClass concrete AST node type that owns this property
     * @param propertyId the property id
     * @param elementType the element type of this property
     * @param cycleRisk <code>true</code> if this property is at risk of cycles, and <code>false</code> if there is no
     * worry about cycles
     */
    ChildListPropertyDescriptor(Class nodeClass, String propertyId, Class elementType, boolean cycleRisk) {
        super(nodeClass, propertyId);
        if (elementType == null) {
            throw new IllegalArgumentException();
        }
        this.elementType = elementType;
        this.cycleRisk = cycleRisk;
    }
}
