// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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
 * Alternate constructor invocation statement AST node type.
 *
 * <pre>
 * ConstructorInvocation:
 *    [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *            <b>this</b> <b>(</b> [ Expression { <b>,</b> Expression } ] <b>)</b> <b>;</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class ConstructorInvocation extends Statement {

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The type arguments (element type: {@link Type}). Null in JLS2. Added in JLS3; defaults to an empty list (see
     * constructor).
     *
     * @since 3.1
     */
    private ASTNode.NodeList typeArguments = null;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList arguments = new ASTNode.NodeList(ARGUMENTS_PROPERTY);

    /**
     * Creates a new AST node for an alternate constructor invocation statement owned by the given AST. By default, an
     * empty list of arguments.
     *
     * @param ast the AST that is to own this node
     */
    ConstructorInvocation(AST ast) {
        super(ast);
        this.typeArguments = new ASTNode.NodeList(TYPE_ARGUMENTS_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 17;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.typeArguments);
            acceptChildren(visitor, this.arguments);
        }

    }

    /**
     * Returns the live ordered list of type arguments of this constructor invocation (added in JLS3 API).
     *
     * @return the live list of type arguments (element type: {@link Type})
     * @since 3.1
     */
    public List typeArguments() {
        // more efficient than just calling unsupportedIn2() to check

        return this.typeArguments;
    }

    /**
     * Returns the live ordered list of argument expressions in this alternate constructor invocation statement.
     *
     * @return the live list of argument expressions (element type: {@link Expression})
     */
    public List arguments() {
        return this.arguments;
    }
}
