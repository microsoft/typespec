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
 * Array initializer AST node type.
 *
 * <pre>
 * ArrayInitializer:
 * 		<b>{</b> [ Expression { <b>,</b> Expression} [ <b>,</b> ]] <b>}</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class ArrayInitializer extends Expression {

    /**
     * The "expressions" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor EXPRESSIONS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The list of expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList expressions = new ASTNode.NodeList(EXPRESSIONS_PROPERTY);

    /**
     * Creates a new AST node for an array initializer owned by the given AST. By default, the list of expressions is
     * empty.
     *
     * @param ast the AST that is to own this node
     */
    ArrayInitializer(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 4;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.expressions);
        }

    }

    /**
     * Returns the live ordered list of expressions in this array initializer.
     *
     * @return the live list of expressions (element type: {@link Expression})
     */
    public List expressions() {
        return this.expressions;
    }
}
