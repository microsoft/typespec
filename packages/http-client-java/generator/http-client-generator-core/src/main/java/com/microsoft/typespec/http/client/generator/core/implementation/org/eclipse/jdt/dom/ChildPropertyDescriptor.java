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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Descriptor for a child property of an AST node. A child property is one whose value is an {@link ASTNode}.
 *
 * @since 3.0
 */
public final class ChildPropertyDescriptor extends StructuralPropertyDescriptor {

    /**
     * Indicates whether a cycle is possible. Field is private, but marked package-visible for fast access from ASTNode.
     */
    final boolean cycleRisk;

    /**
     * Creates a new child property descriptor with the given property id. Note that this constructor is declared
     * package-private so that property descriptors can only be created by the AST implementation.
     *
     * @param childType the child type of this property
     * @param cycleRisk <code>true</code> if this property is at risk of cycles, and <code>false</code> if there is no
     * worry about cycles
     */
    ChildPropertyDescriptor(Class<?> childType, boolean cycleRisk) {
        super();
        if (!ASTNode.class.isAssignableFrom(childType)) {
            throw new IllegalArgumentException();
        }
        this.cycleRisk = cycleRisk;
    }
}
