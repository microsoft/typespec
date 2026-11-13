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
 * Expression statement AST node type. <p> This kind of node is used to convert an expression (<code>Expression</code>)
 * into a statement (<code>Statement</code>) by wrapping it. </p>
 *
 * <pre>
 * ExpressionStatement:
 *    StatementExpression <b>;</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ExpressionStatement extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(ExpressionStatement.class, "expression", Expression.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(ExpressionStatement.class, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The expression; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private volatile Expression expression;

    /**
     * Creates a new unparented expression statement node owned by the given AST. By default, the expression statement
     * is unspecified, but legal, method invocation expression. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ExpressionStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 21;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getExpression());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the expression of this expression statement.
     *
     * @return the expression node
     */
    public Expression getExpression() {
        if (this.expression == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.expression == null) {
                    this.expression = postLazyInit(new MethodInvocation(this.ast), EXPRESSION_PROPERTY);
                }
            }
        }
        return this.expression;
    }

    /**
     * Sets the expression of this expression statement.
     *
     * @param expression the new expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.expression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.expression = expression;

    }
}
