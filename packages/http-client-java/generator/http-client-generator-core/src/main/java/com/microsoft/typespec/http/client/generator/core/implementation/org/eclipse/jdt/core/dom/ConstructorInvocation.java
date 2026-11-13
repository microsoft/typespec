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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
@SuppressWarnings({ "rawtypes", "unchecked" })
public class ConstructorInvocation extends Statement {

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(ConstructorInvocation.class, "typeArguments", Type.class, false); //$NON-NLS-1$

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(ConstructorInvocation.class, "arguments", Expression.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(ConstructorInvocation.class, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(3);
        createPropertyList(ConstructorInvocation.class, properyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

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
        if (ast.apiLevel >= 3) {
            this.typeArguments = new ASTNode.NodeList(TYPE_ARGUMENTS_PROPERTY);
        }
    }

    @Override
    final int getNodeType0() {
        return 17;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            if (this.ast.apiLevel >= 3) {
                acceptChildren(visitor, this.typeArguments);
            }
            acceptChildren(visitor, this.arguments);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of type arguments of this constructor invocation (added in JLS3 API).
     *
     * @return the live list of type arguments (element type: {@link Type})
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public List typeArguments() {
        // more efficient than just calling unsupportedIn2() to check
        if (this.typeArguments == null) {
            unsupportedIn2();
        }
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
