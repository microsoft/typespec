// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2019, 2020 IBM Corporation and others.
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
 * Switch expression AST node type (added in JEP 325).
 *
 * <pre>
 * SwitchExpression:
 *		<b>switch</b> <b>(</b> Expression <b>)</b>
 * 			<b>{</b> { SwitchCase | Statement } <b>}</b>
 * SwitchCase:
 *		<b>case</b> [ Expression { <b>,</b> Expression } ]  <b>{ : | ->}</b>
 *		<b>default</b> <b>{ : | ->}</b>
 * </pre>
 *
 * <code>SwitchCase</code> nodes are treated as a kind of <code>Statement</code>.
 *
 * @since 3.22
 */
@SuppressWarnings({ "rawtypes" })
public class SwitchExpression extends Expression {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.22
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "statements" structural property of this node type (element type: {@link Statement}).
     *
     * @since 3.22
     */
    public static final ChildListPropertyDescriptor STATEMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Statement.class, true);

    /**
     * The expression; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private Expression expression;

    /**
     * The statements and SwitchCase nodes (element type: {@link Statement}). Defaults to an empty list.
     */
    private final ASTNode.NodeList statements = new ASTNode.NodeList(STATEMENTS_PROPERTY);

    /**
     * Creates a new unparented switch statement node owned by the given AST. By default, the swicth statement has an
     * unspecified, but legal, expression, and an empty list of switch groups. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    SwitchExpression(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 100;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChildren(visitor, this.statements);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the expression of this switch statement.
     *
     * @return the expression node
     * @since 3.22
     */
    public Expression getExpression() {
        if (this.expression == null) {
            this.expression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
        }
        return this.expression;
    }

    /**
     * Sets the expression of this switch statement.
     *
     * @param expression the new expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.22
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
     * Returns the live ordered list of statements for this switch statement. Within this list, <code>SwitchCase</code>
     * nodes mark the start of the switch groups.
     *
     * @return the live list of statement nodes (element type: {@link Statement})
     * @since 3.22
     */
    public List statements() {
        return this.statements;
    }
}
