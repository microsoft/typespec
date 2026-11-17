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

import java.util.List;

/**
 * Infix expression AST node type.
 *
 * <pre>
 * InfixExpression:
 *    Expression InfixOperator Expression { InfixOperator Expression }
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class InfixExpression extends Expression {

    /**
     * Infix operators (typesafe enumeration).
     *
     * <pre>
     * InfixOperator:<code>
     *    <b>*</b>	TIMES
     *    <b>/</b>  DIVIDE
     *    <b>%</b>  REMAINDER
     *    <b>+</b>  PLUS
     *    <b>-</b>  MINUS
     *    <b>&lt;&lt;</b>  LEFT_SHIFT
     *    <b>&gt;&gt;</b>  RIGHT_SHIFT_SIGNED
     *    <b>&gt;&gt;&gt;</b>  RIGHT_SHIFT_UNSIGNED
     *    <b>&lt;</b>  LESS
     *    <b>&gt;</b>  GREATER
     *    <b>&lt;=</b>  LESS_EQUALS
     *    <b>&gt;=</b>  GREATER_EQUALS
     *    <b>==</b>  EQUALS
     *    <b>!=</b>  NOT_EQUALS
     *    <b>^</b>  XOR
     *    <b>&amp;</b>  AND
     *    <b>|</b>  OR
     *    <b>&amp;&amp;</b>  CONDITIONAL_AND
     *    <b>||</b>  CONDITIONAL_OR</code>
     * </pre>
     */
    public static class Operator {

        /**
         * The token for the operator.
         */
        private final String token;

        /**
         * Creates a new infix operator with the given token. <p> Note: this constructor is private. The only instances
         * ever created are the ones for the standard operators. </p>
         *
         * @param token the character sequence for the operator
         */
        private Operator(String token) {
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

        /** Multiplication "*" operator. */
        public static final Operator TIMES = new Operator("*");//$NON-NLS-1$
        /** Division "/" operator. */
        public static final Operator DIVIDE = new Operator("/");//$NON-NLS-1$
        /** Remainder "%" operator. */
        public static final Operator REMAINDER = new Operator("%");//$NON-NLS-1$
        /** Addition (or string concatenation) "+" operator. */
        public static final Operator PLUS = new Operator("+");//$NON-NLS-1$
        /** Subtraction "-" operator. */
        public static final Operator MINUS = new Operator("-");//$NON-NLS-1$
        /** Left shift "&lt;&lt;" operator. */
        public static final Operator LEFT_SHIFT = new Operator("<<");//$NON-NLS-1$
        /** Signed right shift "&gt;&gt;" operator. */
        public static final Operator RIGHT_SHIFT_SIGNED = new Operator(">>");//$NON-NLS-1$
        /** Unsigned right shift "&gt;&gt;&gt;" operator. */
        public static final Operator RIGHT_SHIFT_UNSIGNED = new Operator(">>>");//$NON-NLS-1$
        /** Less than "&lt;" operator. */
        public static final Operator LESS = new Operator("<");//$NON-NLS-1$
        /** Greater than "&gt;" operator. */
        public static final Operator GREATER = new Operator(">");//$NON-NLS-1$
        /** Less than or equals "&lt;=" operator. */
        public static final Operator LESS_EQUALS = new Operator("<=");//$NON-NLS-1$
        /** Greater than or equals "&gt;=" operator. */
        public static final Operator GREATER_EQUALS = new Operator(">=");//$NON-NLS-1$
        /** Equals "==" operator. */
        public static final Operator EQUALS = new Operator("==");//$NON-NLS-1$
        /** Not equals "!=" operator. */
        public static final Operator NOT_EQUALS = new Operator("!=");//$NON-NLS-1$
        /** Exclusive OR "^" operator. */
        public static final Operator XOR = new Operator("^");//$NON-NLS-1$
        /** Inclusive OR "|" operator. */
        public static final Operator OR = new Operator("|");//$NON-NLS-1$
        /** AND "&amp;" operator. */
        public static final Operator AND = new Operator("&");//$NON-NLS-1$
        /** Conditional OR "||" operator. */
        public static final Operator CONDITIONAL_OR = new Operator("||");//$NON-NLS-1$
        /** Conditional AND "&amp;&amp;" operator. */
        public static final Operator CONDITIONAL_AND = new Operator("&&");//$NON-NLS-1$
    }

    /**
     * The "leftOperand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor LEFT_OPERAND_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "rightOperand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor RIGHT_OPERAND_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "extendedOperands" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor EXTENDED_OPERANDS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The infix operator; defaults to InfixExpression.Operator.PLUS.
     */
    private InfixExpression.Operator operator = InfixExpression.Operator.PLUS;

    /**
     * The left operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression leftOperand;

    /**
     * The right operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression rightOperand;

    /**
     * The list of extended operand expressions (element type: {@link Expression}). Lazily initialized; defaults to an
     * empty list.
     */
    private ASTNode.NodeList extendedOperands = null;

    /**
     * Creates a new AST node for an infix expression owned by the given AST. By default, the node has unspecified (but
     * legal) operator, left and right operands, and an empty list of additional operands.
     *
     * @param ast the AST that is to own this node
     */
    InfixExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 27;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getLeftOperand());
            acceptChild(visitor, getRightOperand());
            if (this.extendedOperands != null) {
                // be careful not to trigger lazy creation of list
                acceptChildren(visitor, this.extendedOperands);
            }
        }

    }

    /**
     * Returns the operator of this infix expression.
     *
     * @return the infix operator
     */
    public InfixExpression.Operator getOperator() {
        return this.operator;
    }

    /**
     * Sets the operator of this infix expression.
     *
     * @param operator the infix operator
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setOperator(InfixExpression.Operator operator) {

        preValueChange();
        this.operator = operator;

    }

    /**
     * Returns the left operand of this infix expression.
     *
     * @return the left operand node
     */
    public Expression getLeftOperand() {
        if (this.leftOperand == null) {
            this.leftOperand = postLazyInit(new SimpleName(this.ast), LEFT_OPERAND_PROPERTY);
        }
        return this.leftOperand;
    }

    /**
     * Sets the left operand of this infix expression.
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
     * Returns the right operand of this infix expression.
     *
     * @return the right operand node
     */
    public Expression getRightOperand() {
        if (this.rightOperand == null) {
            this.rightOperand = postLazyInit(new SimpleName(this.ast), RIGHT_OPERAND_PROPERTY);
        }
        return this.rightOperand;
    }

    /**
     * Sets the right operand of this infix expression.
     *
     * @param expression the right operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setRightOperand(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.rightOperand;
        preReplaceChild(oldChild, expression, RIGHT_OPERAND_PROPERTY);
        this.rightOperand = expression;

    }

    /**
     * Returns the live list of extended operands. <p> The extended operands is the preferred way of representing deeply
     * nested expressions of the form <code>L op R op R2 op R3...</code> where the same operator appears between all the
     * operands (the most common case being lengthy string concatenation expressions). Using the extended operands keeps
     * the trees from getting too deep; this decreases the risk is running out of thread stack space at runtime when
     * traversing such trees. ((a + b) + c) + d would be translated to: leftOperand: a rightOperand: b extendedOperands:
     * {c, d} operator: + </p>
     *
     * @return the live list of extended operands (element type: {@link Expression})
     */
    public List extendedOperands() {
        if (this.extendedOperands == null) {
            // lazily initialize
            this.extendedOperands = new ASTNode.NodeList(EXTENDED_OPERANDS_PROPERTY);
        }
        return this.extendedOperands;
    }
}
