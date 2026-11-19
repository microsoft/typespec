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
 * Postfix expression AST node type.
 *
 * <pre>
 * PostfixExpression:
 *    Expression PostfixOperator
 * </pre>
 *
 * @since 2.0
 */
public class PostfixExpression extends Expression {

    /**
     * The "operand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor OPERAND_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression operand;

    /**
     * Creates a new AST node for an postfix expression owned by the given AST. By default, the node has unspecified
     * (but legal) operator and operand.
     *
     * @param ast the AST that is to own this node
     */
    PostfixExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 37;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit();
        if (visitChildren) {
            acceptChild(visitor, getOperand());
        }

    }

    /**
     * Returns the operand of this postfix expression.
     *
     * @return the operand expression node
     */
    public Expression getOperand() {
        if (this.operand == null) {
            this.operand = postLazyInit(new SimpleName(this.ast), OPERAND_PROPERTY);
        }
        return this.operand;
    }

    /**
     * Sets the operand of this postfix expression.
     *
     * @param expression the operand expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setOperand(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.operand;
        preReplaceChild(oldChild, expression, OPERAND_PROPERTY);
        this.operand = expression;

    }
}
