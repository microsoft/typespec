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
 * Abstract base class for property descriptors of AST nodes. There are two kinds of properties: <ul> <li>child
 * properties ({@link ChildPropertyDescriptor}) - properties whose value is another AST node; for example, the name of a
 * {@link MethodDeclaration}</li> <li>child list properties
 * ({@link ChildListPropertyDescriptor}) - properties where the value is a list of AST nodes; for example, the
 * statements of a {@link Block}</li> </ul>
 *
 * @since 3.0
 * @noextend This class is not intended to be subclassed by clients.
 */
public abstract class StructuralPropertyDescriptor {

    /**
     * Creates a new property descriptor for the given node type with the given property id. Note that this constructor
     * is declared package-private so that property descriptors can only be created by the AST implementation.
     *
     */
    StructuralPropertyDescriptor() {

    }

}
