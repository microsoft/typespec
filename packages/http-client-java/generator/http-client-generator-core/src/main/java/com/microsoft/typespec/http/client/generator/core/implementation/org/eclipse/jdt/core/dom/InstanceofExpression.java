// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 * Instanceof expression AST node type.
 *
 * <pre>
 * InstanceofExpression:
 *    Expression <b>instanceof</b> Type
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class InstanceofExpression extends Expression {

    /**
     * The "leftOperand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor LEFT_OPERAND_PROPERTY
        = new ChildPropertyDescriptor(InstanceofExpression.class, "leftOperand", Expression.class, true); //$NON-NLS-1$

    /**
     * The "rightOperand" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor RIGHT_OPERAND_PROPERTY
        = new ChildPropertyDescriptor(InstanceofExpression.class, "rightOperand", Type.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(InstanceofExpression.class, properyList);
        addProperty(LEFT_OPERAND_PROPERTY, properyList);
        addProperty(RIGHT_OPERAND_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The left operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private volatile Expression leftOperand;

    /**
     * The right operand; lazily initialized; defaults to an unspecified, but legal, simple type.
     */
    private volatile Type rightOperand;

    /**
     * Creates a new AST node for an instanceof expression owned by the given AST. By default, the node has unspecified
     * (but legal) operator, left and right operands.
     *
     * @param ast the AST that is to own this node
     */
    InstanceofExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 62;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getLeftOperand());
            acceptChild(visitor, getRightOperand());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the left operand of this instanceof expression.
     *
     * @return the left operand node
     */
    public Expression getLeftOperand() {
        if (this.leftOperand == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.leftOperand == null) {
                    this.leftOperand = postLazyInit(new SimpleName(this.ast), LEFT_OPERAND_PROPERTY);
                }
            }
        }
        return this.leftOperand;
    }

    /**
     * Sets the left operand of this instanceof expression.
     *
     * @param expression the left operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setLeftOperand(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.leftOperand;
        preReplaceChild(oldChild, expression, LEFT_OPERAND_PROPERTY);
        this.leftOperand = expression;

    }

    /**
     * Returns the right operand of this instanceof expression.
     *
     * @return the right operand node
     */
    public Type getRightOperand() {
        if (this.rightOperand == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.rightOperand == null) {
                    this.rightOperand = postLazyInit(new SimpleType(this.ast), RIGHT_OPERAND_PROPERTY);
                }
            }
        }
        return this.rightOperand;
    }

    /**
     * Sets the right operand of this instanceof expression.
     *
     * @param referenceType the right operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setRightOperand(Type referenceType) {
        if (referenceType == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.rightOperand;
        preReplaceChild(oldChild, referenceType, RIGHT_OPERAND_PROPERTY);
        this.rightOperand = referenceType;

    }
}
