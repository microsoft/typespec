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
 * Array access expression AST node type.
 *
 * <pre>
 * ArrayAccess:
 *    Expression <b>[</b> Expression <b>]</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ArrayAccess extends Expression {

    /**
     * The "array" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor ARRAY_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "index" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor INDEX_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The array expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression arrayExpression;

    /**
     * The index expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression indexExpression;

    /**
     * Creates a new unparented array access expression node owned by the given AST. By default, the array and index
     * expresssions are unspecified, but legal. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ArrayAccess(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 2;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getArray());
            acceptChild(visitor, getIndex());
        }

    }

    /**
     * Returns the array expression of this array access expression.
     *
     * @return the array expression node
     */
    public Expression getArray() {
        if (this.arrayExpression == null) {
            this.arrayExpression = postLazyInit(new SimpleName(this.ast), ARRAY_PROPERTY);
        }
        return this.arrayExpression;
    }

    /**
     * Sets the array expression of this array access expression.
     *
     * @param expression the array expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setArray(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        // an ArrayAccess may occur inside an Expression
        // must check cycles
        ASTNode oldChild = this.arrayExpression;
        preReplaceChild(oldChild, expression, ARRAY_PROPERTY);
        this.arrayExpression = expression;

    }

    /**
     * Returns the index expression of this array access expression.
     *
     * @return the index expression node
     */
    public Expression getIndex() {
        if (this.indexExpression == null) {
            this.indexExpression = postLazyInit(new SimpleName(this.ast), INDEX_PROPERTY);
        }
        return this.indexExpression;
    }

    /**
     * Sets the index expression of this array access expression.
     *
     * @param expression the index expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setIndex(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        // an ArrayAccess may occur inside an Expression
        // must check cycles
        ASTNode oldChild = this.indexExpression;
        preReplaceChild(oldChild, expression, INDEX_PROPERTY);
        this.indexExpression = expression;

    }
}
