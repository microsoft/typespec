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

/**
 * Assert statement AST node type.
 *
 * <pre>
 * AssertStatement:
 *    <b>assert</b> Expression [ <b>:</b> Expression ] <b>;</b>
 * </pre>
 *
 * @since 2.0
 */
public class AssertStatement extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "message" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor MESSAGE_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The expression; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private Expression expression;

    /**
     * The message expression; <code>null</code> for none; defaults to none.
     */
    private Expression optionalMessageExpression = null;

    /**
     * Creates a new unparented assert statement node owned by the given AST. By default, the assert statement has an
     * unspecified, but legal, expression, and not message expression. <p> N.B. This constructor is package-private.
     * </p>
     *
     * @param ast the AST that is to own this node
     */
    AssertStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 6;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getMessage());
        }

    }

    /**
     * Returns the first expression of this assert statement.
     *
     * @return the expression node
     */
    public Expression getExpression() {
        if (this.expression == null) {
            this.expression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
        }
        return this.expression;
    }

    /**
     * Sets the first expression of this assert statement.
     *
     * @param expression the new expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        // an AssertStatement may occur inside an Expression - must check cycles
        ASTNode oldChild = this.expression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.expression = expression;

    }

    /**
     * Returns the message expression of this assert statement, or <code>null</code> if there is none.
     *
     * @return the message expression node, or <code>null</code> if there is none
     */
    public Expression getMessage() {
        return this.optionalMessageExpression;
    }

    /**
     * Sets or clears the message expression of this assert statement.
     *
     * @param expression the message expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setMessage(Expression expression) {
        // an AssertStatement may occur inside an Expression - must check cycles
        ASTNode oldChild = this.optionalMessageExpression;
        preReplaceChild(oldChild, expression, MESSAGE_PROPERTY);
        this.optionalMessageExpression = expression;

    }
}
