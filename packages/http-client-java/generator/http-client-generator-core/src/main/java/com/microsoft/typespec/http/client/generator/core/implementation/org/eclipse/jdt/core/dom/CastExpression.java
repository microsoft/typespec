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
 * Cast expression AST node type.
 *
 * <pre>
 * CastExpression:
 *    <b>(</b> Type <b>)</b> Expression
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class CastExpression extends Expression {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY
        = new ChildPropertyDescriptor(CastExpression.class, "type", Type.class, false); //$NON-NLS-1$

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(CastExpression.class, "expression", Expression.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(CastExpression.class, properyList);
        addProperty(TYPE_PROPERTY, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The type; lazily initialized; defaults to a unspecified, legal type.
     */
    private volatile Type type;

    /**
     * The expression; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private volatile Expression expression;

    /**
     * Creates a new AST node for a cast expression owned by the given AST. By default, the type and expression are
     * unspecified (but legal). <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    CastExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 11;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getType());
            acceptChild(visitor, getExpression());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the type in this cast expression.
     *
     * @return the type
     */
    public Type getType() {
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
                }
            }
        }
        return this.type;
    }

    /**
     * Sets the type in this cast expression to the given type.
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.type;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.type = type;

    }

    /**
     * Returns the expression of this cast expression.
     *
     * @return the expression node
     */
    public Expression getExpression() {
        if (this.expression == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.expression == null) {
                    this.expression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
                }
            }
        }
        return this.expression;
    }

    /**
     * Sets the expression of this cast expression.
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
