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
 * If statement AST node type.
 *
 * <pre>
 * IfStatement:
 *    <b>if</b> <b>(</b> Expression <b>)</b> Statement [ <b>else</b> Statement]
 * </pre>
 *
 * @since 2.0
 */
public class IfStatement extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "thenStatement" structural property of this node type (child type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor THEN_STATEMENT_PROPERTY
        = new ChildPropertyDescriptor(Statement.class, true);

    /**
     * The "elseStatement" structural property of this node type (child type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor ELSE_STATEMENT_PROPERTY
        = new ChildPropertyDescriptor(Statement.class, true);

    /**
     * The expression; lazily initialized; defaults to an unspecified, but legal, expression.
     */
    private Expression expression;

    /**
     * The then statement; lazily initialized; defaults to an unspecified, but legal, statement.
     */
    private Statement thenStatement;

    /**
     * The else statement; <code>null</code> for none; defaults to none.
     */
    private Statement optionalElseStatement;

    /**
     * Creates a new unparented if statement node owned by the given AST. By default, the expresssion is unspecified,
     * but legal, the then statement is an empty block, and there is no else statement. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    IfStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 25;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getThenStatement());
            acceptChild(visitor, getElseStatement());
        }

    }

    /**
     * Returns the expression of this if statement.
     *
     * @return the expression node
     */
    public Expression getExpression() {
        if (this.expression == null) {
            this.expression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
        }
        return this.expression;
    }

    /**
     * Sets the condition of this if statement.
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
     * Returns the "then" part of this if statement.
     *
     * @return the "then" statement node
     */
    public Statement getThenStatement() {
        if (this.thenStatement == null) {
            this.thenStatement = postLazyInit(new Block(this.ast), THEN_STATEMENT_PROPERTY);
        }
        return this.thenStatement;
    }

    /**
     * Sets the "then" part of this if statement. <p> Special note: The Java language does not allow a local variable
     * declaration to appear as the "then" part of an if statement (they may only appear within a block). However, the
     * AST will allow a <code>VariableDeclarationStatement</code> as the thenStatement of a <code>IfStatement</code>. To
     * get something that will compile, be sure to embed the <code>VariableDeclarationStatement</code> inside a
     * <code>Block</code>. </p>
     *
     * @param statement the "then" statement node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setThenStatement(Statement statement) {
        if (statement == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.thenStatement;
        preReplaceChild(oldChild, statement, THEN_STATEMENT_PROPERTY);
        this.thenStatement = statement;

    }

    /**
     * Returns the "else" part of this if statement, or <code>null</code> if this if statement has <b>no</b> "else"
     * part. <p> Note that there is a subtle difference between having no else statement and having an empty statement
     * ("{}") or null statement (";"). </p>
     *
     * @return the "else" statement node, or <code>null</code> if none
     */
    public Statement getElseStatement() {
        return this.optionalElseStatement;
    }

    /**
     * Sets or clears the "else" part of this if statement. <p> Note that there is a subtle difference between having no
     * else part (as in <code>"if(true){}"</code>) and having an empty block (as in "if(true){}else{}") or null
     * statement (as in "if(true){}else;"). </p> <p> Special note: The Java language does not allow a local variable
     * declaration to appear as the "else" part of an if statement (they may only appear within a block). However, the
     * AST will allow a <code>VariableDeclarationStatement</code> as the elseStatement of a <code>IfStatement</code>. To
     * get something that will compile, be sure to embed the <code>VariableDeclarationStatement</code> inside a
     * <code>Block</code>. </p>
     *
     * @param statement the "else" statement node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setElseStatement(Statement statement) {
        ASTNode oldChild = this.optionalElseStatement;
        preReplaceChild(oldChild, statement, ELSE_STATEMENT_PROPERTY);
        this.optionalElseStatement = statement;

    }
}
