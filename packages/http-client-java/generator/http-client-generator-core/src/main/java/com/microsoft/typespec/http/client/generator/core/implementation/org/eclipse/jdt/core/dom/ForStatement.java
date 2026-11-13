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
 * For statement AST node type.
 *
 * <pre>
 * ForStatement:
 *    <b>for</b> <b>(</b>
 * 			[ ForInit ]<b>;</b>
 * 			[ Expression ] <b>;</b>
 * 			[ ForUpdate ] <b>)</b>
 * 			Statement
 * ForInit:
 * 		Expression { <b>,</b> Expression }
 * ForUpdate:
 * 		Expression { <b>,</b> Expression }
 * </pre>
 *
 * <p> Note: When variables are declared in the initializer of a for statement such as "<code>for (int a=1,
 * b=2;;);</code>", they should be represented as a single <code>VariableDeclarationExpression</code> with two
 * fragments, rather than being split up into a pair of expressions. </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class ForStatement extends Statement {

    /**
     * The "initializers" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor INITIALIZERS_PROPERTY
        = new ChildListPropertyDescriptor(ForStatement.class, "initializers", Expression.class, true); //$NON-NLS-1$

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(ForStatement.class, "expression", Expression.class, true); //$NON-NLS-1$

    /**
     * The "updaters" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor UPDATERS_PROPERTY
        = new ChildListPropertyDescriptor(ForStatement.class, "updaters", Expression.class, true); //$NON-NLS-1$

    /**
     * The "body" structural property of this node type (child type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY
        = new ChildPropertyDescriptor(ForStatement.class, "body", Statement.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(5);
        createPropertyList(ForStatement.class, properyList);
        addProperty(INITIALIZERS_PROPERTY, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        addProperty(UPDATERS_PROPERTY, properyList);
        addProperty(BODY_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The list of initializer expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList initializers = new ASTNode.NodeList(INITIALIZERS_PROPERTY);

    /**
     * The condition expression; <code>null</code> for none; defaults to none.
     */
    private Expression optionalConditionExpression = null;

    /**
     * The list of update expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList updaters = new ASTNode.NodeList(UPDATERS_PROPERTY);

    /**
     * The body statement; lazily initialized; defaults to an empty block statement.
     */
    private volatile Statement body;

    /**
     * Creates a new AST node for a for statement owned by the given AST. By default, there are no initializers, no
     * condition expression, no updaters, and the body is an empty block.
     *
     * @param ast the AST that is to own this node
     */
    ForStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 24;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.initializers);
            acceptChild(visitor, getExpression());
            acceptChildren(visitor, this.updaters);
            acceptChild(visitor, getBody());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of initializer expressions in this for statement. <p> The list should consist of
     * either a list of so called statement expressions (JLS2, 14.8), or a single
     * <code>VariableDeclarationExpression</code>. Otherwise, the for statement would have no Java source equivalent.
     * </p>
     *
     * @return the live list of initializer expressions (element type: {@link Expression})
     */
    public List initializers() {
        return this.initializers;
    }

    /**
     * Returns the condition expression of this for statement, or <code>null</code> if there is none.
     *
     * @return the condition expression node, or <code>null</code> if there is none
     */
    public Expression getExpression() {
        return this.optionalConditionExpression;
    }

    /**
     * Sets or clears the condition expression of this return statement.
     *
     * @param expression the condition expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        ASTNode oldChild = this.optionalConditionExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.optionalConditionExpression = expression;

    }

    /**
     * Returns the live ordered list of update expressions in this for statement. <p> The list should consist of so
     * called statement expressions. Otherwise, the for statement would have no Java source equivalent. </p>
     *
     * @return the live list of update expressions (element type: {@link Expression})
     */
    public List updaters() {
        return this.updaters;
    }

    /**
     * Returns the body of this for statement.
     *
     * @return the body statement node
     */
    public Statement getBody() {
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
     * Sets the body of this for statement. <p> Special note: The Java language does not allow a local variable
     * declaration to appear as the body of a for statement (they may only appear within a block). However, the AST will
     * allow a <code>VariableDeclarationStatement</code> as the body of a <code>ForStatement</code>. To get something
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
}
