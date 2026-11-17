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
 * Conditional expression AST node type.
 *
 * <pre>
 * ConditionalExpression:
 *    Expression <b>?</b> Expression <b>:</b> Expression
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ConditionalExpression extends Expression {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "thenExpression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor THEN_EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "elseExpression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor ELSE_EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The condition expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression conditionExpression;

    /**
     * The "then" expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression thenExpression;

    /**
     * The "else" expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression elseExpression;

    /**
     * Creates a new unparented conditional expression node owned by the given AST. By default, the condition, "then",
     * and "else" expresssions are unspecified, but legal. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ConditionalExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 16;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getThenExpression());
            acceptChild(visitor, getElseExpression());
        }

    }

    /**
     * Returns the condition of this conditional expression.
     *
     * @return the condition node
     */
    public Expression getExpression() {
        if (this.conditionExpression == null) {
            this.conditionExpression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
        }
        return this.conditionExpression;
    }

    /**
     * Sets the condition of this conditional expression.
     *
     * @param expression the condition node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.conditionExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.conditionExpression = expression;

    }

    /**
     * Returns the "then" part of this conditional expression.
     *
     * @return the "then" expression node
     */
    public Expression getThenExpression() {
        if (this.thenExpression == null) {
            this.thenExpression = postLazyInit(new SimpleName(this.ast), THEN_EXPRESSION_PROPERTY);
        }
        return this.thenExpression;
    }

    /**
     * Sets the "then" part of this conditional expression.
     *
     * @param expression the "then" expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setThenExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.thenExpression;
        preReplaceChild(oldChild, expression, THEN_EXPRESSION_PROPERTY);
        this.thenExpression = expression;

    }

    /**
     * Returns the "else" part of this conditional expression.
     *
     * @return the "else" expression node
     */
    public Expression getElseExpression() {
        if (this.elseExpression == null) {
            this.elseExpression = postLazyInit(new SimpleName(this.ast), ELSE_EXPRESSION_PROPERTY);
        }
        return this.elseExpression;
    }

    /**
     * Sets the "else" part of this conditional expression.
     *
     * @param expression the "else" expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setElseExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.elseExpression;
        preReplaceChild(oldChild, expression, ELSE_EXPRESSION_PROPERTY);
        this.elseExpression = expression;

    }
}
