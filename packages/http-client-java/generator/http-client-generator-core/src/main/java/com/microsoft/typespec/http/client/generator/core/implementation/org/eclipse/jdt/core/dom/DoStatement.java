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
 * Do statement AST node type.
 *
 * <pre>
 * DoStatement:
 *    <b>do</b> Statement <b>while</b> <b>(</b> Expression <b>)</b> <b>;</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class DoStatement extends Statement {

    /**
     * The "body" structural property of this node type (child type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY
        = new ChildPropertyDescriptor(DoStatement.class, "body", Statement.class, true); //$NON-NLS-1$

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(DoStatement.class, "expression", Expression.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(DoStatement.class, properyList);
        addProperty(BODY_PROPERTY, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The body statement; lazily initialized; defaults to an empty block.
     */
    private volatile Statement body;

    /**
     * The expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private volatile Expression expression;

    /**
     * Creates a new unparented do statement node owned by the given AST. By default, the expression is unspecified, but
     * legal, and the body statement is an empty block. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    DoStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 19;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getBody());
            acceptChild(visitor, getExpression());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the body of this do statement.
     *
     * @return the body statement node
     */
    public Statement getBody() {
        Statement b = this.body;
        if (b == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                b = this.body;
                if (b == null) {
                    b = postLazyInit(new Block(this.ast), BODY_PROPERTY);
                    this.body = b;
                }
            }
        }
        return b;
    }

    /**
     * Sets the body of this do statement. <p> Special note: The Java language does not allow a local variable
     * declaration to appear as the body of a do statement (they may only appear within a block). However, the AST will
     * allow a <code>VariableDeclarationStatement</code> as the body of a <code>DoStatement</code>. To get something
     * that will compile, be sure to embed the <code>VariableDeclarationStatement</code> inside a <code>Block</code>.
     * </p>
     *
     * @param statement the body statement node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Statement statement) {
        if (statement == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, statement, BODY_PROPERTY);
        this.body = statement;

    }

    /**
     * Returns the expression of this do statement.
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
     * Sets the expression of this do statement.
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
}
