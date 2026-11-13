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
 * Synchronized statement AST node type.
 *
 * <pre>
 * SynchronizedStatement:
 *    <b>synchronized</b> <b>(</b> Expression <b>)</b> Block
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class SynchronizedStatement extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(SynchronizedStatement.class, "expression", Expression.class, true); //$NON-NLS-1$

    /**
     * The "body" structural property of this node type (child type: {@link Block}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY
        = new ChildPropertyDescriptor(SynchronizedStatement.class, "body", Block.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(SynchronizedStatement.class, propertyList);
        addProperty(EXPRESSION_PROPERTY, propertyList);
        addProperty(BODY_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private volatile Expression expression;

    /**
     * The body; lazily initialized; defaults to an empty block.
     */
    private volatile Block body;

    /**
     * Creates a new unparented synchronized statement node owned by the given AST. By default, the expression is
     * unspecified, but legal, and the blody is an empty block. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    SynchronizedStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 51;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getBody());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the expression of this synchronized statement.
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
     * Sets the expression of this synchronized statement.
     *
     * @param expression the expression node
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

    /**
     * Returns the body of this synchronized statement.
     *
     * @return the body block node
     */
    public Block getBody() {
        if (this.body == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.body == null) {
                    this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
                }
            }
        }
        return this.body;
    }

    /**
     * Sets the body of this synchronized statement.
     *
     * @param block the body statement node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Block block) {
        if (block == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, block, BODY_PROPERTY);
        this.body = block;

    }
}
