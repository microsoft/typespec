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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Postfix expression AST node type.
 *
 * <pre>
 * PostfixExpression:
 *    Expression PostfixOperator
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class PostfixExpression extends Expression {

    /**
     * Postfix operators (typesafe enumeration).
     *
     * <pre>
     * PostfixOperator:
     *    <b><code>++</code></b>  <code>INCREMENT</code>
     *    <b><code>--</code></b>  <code>DECREMENT</code>
     * </pre>
     */
    public static class Operator {

        /**
         * The token for the operator.
         */
        private final String token;

        /**
         * Creates a new postfix operator with the given token. <p> Note: this constructor is private. The only
         * instances ever created are the ones for the standard operators. </p>
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

        /** Postfix increment "++" operator. */
        public static final Operator INCREMENT = new Operator("++");//$NON-NLS-1$
        /** Postfix decrement "--" operator. */
        public static final Operator DECREMENT = new Operator("--");//$NON-NLS-1$

        /**
         * Map from token to operator (key type: <code>String</code>; value type: <code>Operator</code>).
         */
        private static final Map CODES;
        static {
            CODES = new HashMap(20);
            Operator[] ops = { INCREMENT, DECREMENT, };
            for (Operator op : ops) {
                CODES.put(op.toString(), op);
            }
        }
    }

    /**
     * The "operator" structural property of this node type (type: {@link PostfixExpression.Operator}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor OPERATOR_PROPERTY
        = new SimplePropertyDescriptor(PostfixExpression.class, "operator", PostfixExpression.Operator.class); //$NON-NLS-1$

    /**
     * The "operand" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor OPERAND_PROPERTY
        = new ChildPropertyDescriptor(PostfixExpression.class, "operand", Expression.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(PostfixExpression.class, propertyList);
        addProperty(OPERAND_PROPERTY, propertyList);
        addProperty(OPERATOR_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The operator; defaults to an unspecified postfix operator.
     */
    private PostfixExpression.Operator operator = PostfixExpression.Operator.INCREMENT;

    /**
     * The operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private volatile Expression operand;

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
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getOperand());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the operator of this postfix expression.
     *
     * @return the operator
     */
    public PostfixExpression.Operator getOperator() {
        return this.operator;
    }

    /**
     * Sets the operator of this postfix expression.
     *
     * @param operator the operator
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setOperator(PostfixExpression.Operator operator) {
        if (operator == null) {
            throw new IllegalArgumentException();
        }
        preValueChange();
        this.operator = operator;

    }

    /**
     * Returns the operand of this postfix expression.
     *
     * @return the operand expression node
     */
    public Expression getOperand() {
        if (this.operand == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.operand == null) {
                    this.operand = postLazyInit(new SimpleName(this.ast), OPERAND_PROPERTY);
                }
            }
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
