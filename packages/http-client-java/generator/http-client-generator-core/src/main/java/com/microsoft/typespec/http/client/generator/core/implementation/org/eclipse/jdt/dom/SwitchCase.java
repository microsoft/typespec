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
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Switch case AST node type. A switch case is a special kind of node used only in switch statements. It is a
 * <code>Statement</code> in name only.
 *
 * <pre>
 * SwitchCase:
 * 		<b>case</b> Expression  <b>:</b>
 * 		<b>default</b> <b>:</b>
 * </pre>
 *
 * @since 2.0
 */
public class SwitchCase extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The expression; <code>null</code> for the "default:" case.
     */
    private Expression optionalExpression = null;

    /**
     * Creates a new AST node for a switch case pseudo-statement owned by the given AST. By default, there is no
     * expression.
     *
     * @param ast the AST that is to own this node
     */
    SwitchCase(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 49;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, this.optionalExpression);
        }
    }

    /**
     * Returns the expression of this switch case, or <code>null</code> if there is none (the "default:" case).
     *
     * @return the expression node, or <code>null</code> if there is none
     */
    public Expression getExpression() {
        return this.optionalExpression;
    }

    /**
     * Sets the expression of this switch case, or clears it (turns it into the "default:" case).
     *
     * @param expression the expression node, or <code>null</code> to turn it into the "default:" case
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        ASTNode oldChild = this.optionalExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.optionalExpression = expression;
    }

    /**
     * Returns whether this switch case represents the "default:" case. <p> This convenience method is equivalent to
     * <code>getExpression() == null</code>. </p>
     *
     * @return <code>true</code> if this is the default switch case, and <code>false</code> if this is a non-default
     * switch case
     */
    public boolean isDefault() {
        return this.optionalExpression == null;
    }
}
