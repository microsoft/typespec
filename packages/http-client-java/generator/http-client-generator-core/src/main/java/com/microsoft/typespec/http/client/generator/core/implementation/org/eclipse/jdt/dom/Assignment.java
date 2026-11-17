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
 * Assignment expression AST node type.
 *
 * <pre>
 * Assignment:
 *    Expression AssignmentOperator Expression
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class Assignment extends Expression {

    /**
     * Assignment operators (typesafe enumeration).
     *
     * <pre>
     * AssignmentOperator:<code>
     *    <b>=</b> ASSIGN
     *    <b>+=</b> PLUS_ASSIGN
     *    <b>-=</b> MINUS_ASSIGN
     *    <b>*=</b> TIMES_ASSIGN
     *    <b>/=</b> DIVIDE_ASSIGN
     *    <b>&amp;=</b> BIT_AND_ASSIGN
     *    <b>|=</b> BIT_OR_ASSIGN
     *    <b>^=</b> BIT_XOR_ASSIGN
     *    <b>%=</b> REMAINDER_ASSIGN
     *    <b>&lt;&lt;=</b> LEFT_SHIFT_ASSIGN
     *    <b>&gt;&gt;=</b> RIGHT_SHIFT_SIGNED_ASSIGN
     *    <b>&gt;&gt;&gt;=</b> RIGHT_SHIFT_UNSIGNED_ASSIGN</code>
     * </pre>
     */
    public static class Operator {

        /**
         * The name of the operator
         */
        private final String op;

        /**
         * Creates a new assignment operator with the given name. <p> Note: this constructor is private. The only
         * instances ever created are the ones for the standard operators. </p>
         *
         * @param op the character sequence for the operator
         */
        private Operator(String op) {
            this.op = op;
        }

        /**
         * Returns the character sequence for the operator.
         *
         * @return the character sequence for the operator
         */
        @Override
        public String toString() {
            return this.op;
        }

        /** = operator. */
        public static final Operator ASSIGN = new Operator("=");//$NON-NLS-1$
        /** += operator. */
        public static final Operator PLUS_ASSIGN = new Operator("+=");//$NON-NLS-1$
        /** -= operator. */
        public static final Operator MINUS_ASSIGN = new Operator("-=");//$NON-NLS-1$
        /** *= operator. */
        public static final Operator TIMES_ASSIGN = new Operator("*=");//$NON-NLS-1$
        /** /= operator. */
        public static final Operator DIVIDE_ASSIGN = new Operator("/=");//$NON-NLS-1$
        /** &amp;= operator. */
        public static final Operator BIT_AND_ASSIGN = new Operator("&=");//$NON-NLS-1$
        /** |= operator. */
        public static final Operator BIT_OR_ASSIGN = new Operator("|=");//$NON-NLS-1$
        /** ^= operator. */
        public static final Operator BIT_XOR_ASSIGN = new Operator("^=");//$NON-NLS-1$
        /** %= operator. */
        public static final Operator REMAINDER_ASSIGN = new Operator("%=");//$NON-NLS-1$
        /** &lt;&lt;== operator. */
        public static final Operator LEFT_SHIFT_ASSIGN = new Operator("<<=");//$NON-NLS-1$
        /** &gt;&gt;= operator. */
        public static final Operator RIGHT_SHIFT_SIGNED_ASSIGN = new Operator(">>=");//$NON-NLS-1$
        /** &gt;&gt;&gt;= operator. */
        public static final Operator RIGHT_SHIFT_UNSIGNED_ASSIGN = new Operator(">>>=");//$NON-NLS-1$
    }

    /**
     * The "leftHandSide" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor LEFT_HAND_SIDE_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "rightHandSide" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor RIGHT_HAND_SIDE_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The assignment operator; defaults to Assignment.Operator.ASSIGN
     */
    private Assignment.Operator assignmentOperator = Assignment.Operator.ASSIGN;

    /**
     * The left hand side; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression leftHandSide;

    /**
     * The right hand side; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression rightHandSide;

    /**
     * Creates a new AST node for an assignment expression owned by the given AST. By default, the node has an
     * assignment operator, and unspecified left and right hand sides.
     *
     * @param ast the AST that is to own this node
     */
    Assignment(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 7;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getLeftHandSide());
            acceptChild(visitor, getRightHandSide());
        }

    }

    /**
     * Returns the operator of this assignment expression.
     *
     * @return the assignment operator
     */
    public Assignment.Operator getOperator() {
        return this.assignmentOperator;
    }

    /**
     * Sets the operator of this assignment expression.
     *
     * @param assignmentOperator the assignment operator
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setOperator(Assignment.Operator assignmentOperator) {

        preValueChange();
        this.assignmentOperator = assignmentOperator;

    }

    /**
     * Returns the left hand side of this assignment expression.
     *
     * @return the left hand side node
     */
    public Expression getLeftHandSide() {
        if (this.leftHandSide == null) {
            this.leftHandSide = postLazyInit(new SimpleName(this.ast), LEFT_HAND_SIDE_PROPERTY);
        }
        return this.leftHandSide;
    }

    /**
     * Sets the left hand side of this assignment expression.
     *
     * @param expression the left hand side node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setLeftHandSide(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        // an Assignment may occur inside a Expression - must check cycles
        ASTNode oldChild = this.leftHandSide;
        preReplaceChild(oldChild, expression, LEFT_HAND_SIDE_PROPERTY);
        this.leftHandSide = expression;

    }

    /**
     * Returns the right hand side of this assignment expression.
     *
     * @return the right hand side node
     */
    public Expression getRightHandSide() {
        if (this.rightHandSide == null) {
            this.rightHandSide = postLazyInit(new SimpleName(this.ast), RIGHT_HAND_SIDE_PROPERTY);
        }
        return this.rightHandSide;
    }

    /**
     * Sets the right hand side of this assignment expression.
     *
     * @param expression the right hand side node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setRightHandSide(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        // an Assignment may occur inside a Expression - must check cycles
        ASTNode oldChild = this.rightHandSide;
        preReplaceChild(oldChild, expression, RIGHT_HAND_SIDE_PROPERTY);
        this.rightHandSide = expression;

    }
}
