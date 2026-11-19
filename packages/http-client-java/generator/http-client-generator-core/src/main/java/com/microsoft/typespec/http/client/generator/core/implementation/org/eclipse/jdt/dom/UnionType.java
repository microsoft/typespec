// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2011, 2013 IBM Corporation and others.
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

import java.util.List;

/**
 * Type node for an union type (added in JLS4 API).
 *
 * <pre>
 * UnionType:
 *    Type <b>|</b> Type { <b>|</b> Type }
 * </pre>
 *
 * <p> This kind of node is used inside a catch clause's formal parameter type. </p>
 *
 * @since 3.7.1
 */
public class UnionType extends Type {

    /**
     * The "types" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPES_PROPERTY = new ChildListPropertyDescriptor(Type.class, true);

    /**
     * The list of types (element type: {@link Type}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Type> types = new ASTNode.NodeList<>(TYPES_PROPERTY);

    /**
     * Creates a new unparented node for an union type owned by the given AST. By default, it has no types.
     * <p>
     * N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    UnionType(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 84;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.types);
        }

    }

    /**
     * Returns the live ordered list of types in this union type. Adding and removing nodes from this list affects this
     * node dynamically. All nodes in this list must be <code>Type</code>s; attempts to add any other type of node will
     * trigger an exception.
     *
     * @return the live list of types in this union type (element type: {@link Type})
     */
    public List<Type> types() {
        return this.types;
    }
}
