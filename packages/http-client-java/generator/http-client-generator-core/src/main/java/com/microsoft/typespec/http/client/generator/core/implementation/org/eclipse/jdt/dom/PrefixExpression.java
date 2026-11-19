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
 * Prefix expression AST node type.
 *
 * <pre>
 * PrefixExpression:
 *    PrefixOperator Expression
 * </pre>
 *
 * @since 2.0
 */
public class PrefixExpression extends Expression {

    /**
     * Prefix operators.
     *
     * <pre>
     * PrefixOperator:
     *    <b><code>++</code></b>  <code>INCREMENT</code>
     *    <b><code>--</code></b>  <code>DECREMENT</code>
     *    <b><code>+</code></b>  <code>PLUS</code>
     *    <b><code>-</code></b>  <code>MINUS</code>
     *    <b><code>~</code></b>  <code>COMPLEMENT</code>
     *    <b><code>!</code></b>  <code>NOT</code>
     * </pre>
     */
    public enum Operator {
        /** Prefix increment "++" operator. */
        INCREMENT("++"),
        /** Prefix decrement "--" operator. */
        DECREMENT("--"),
        /** Unary plus "+" operator. */
        PLUS("+"),
        /** Unary minus "-" operator. */
        MINUS("-"),
        /** Bitwise complement "~" operator. */
        COMPLEMENT("~"),
        /** Logical complement "!" operator. */
        NOT("!");

        private final String token;

        Operator(String token) {
            this.token = token;
        }

        /**
         * Returns the character sequence for the operator.
         *
         * @return the character sequence for the operator
         */
        @Override
        public String toString() {
            return this.token;
        }
    }

    /**
     * The "operand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor OPERAND_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The operator; defaults to an unspecified prefix operator.
     */
    private PrefixExpression.Operator operator = PrefixExpression.Operator.PLUS;

    /**
     * The operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression operand;

    /**
     * Creates a new AST node for an prefix expression owned by the given AST. By default, the node has unspecified (but
     * legal) operator and operand.
     *
     * @param ast the AST that is to own this node
     */
    PrefixExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 38;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getOperand());
        }

    }

    /**
     * Returns the operator of this prefix expression.
     *
     * @return the operator
     */
    public PrefixExpression.Operator getOperator() {
        return this.operator;
    }

    /**
     * Sets the operator of this prefix expression.
     *
     * @param operator the operator
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setOperator(PrefixExpression.Operator operator) {

        this.operator = operator;

    }

    /**
     * Returns the operand of this prefix expression.
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
     * Sets the operand of this prefix expression.
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
