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
 * Enhanced For statement AST node type (added in JLS3 API).
 *
 * <pre>
 * EnhancedForStatement:
 *    <b>for</b> <b>(</b> FormalParameter <b>:</b> Expression <b>)</b>
 * 			Statement
 * </pre>
 *
 * <p>The FormalParameter is represented by a {@link SingleVariableDeclaration} (without an initializer).</p>
 *
 * @since 3.1
 */
public class EnhancedForStatement extends Statement {

    /**
     * The "parameter" structural property of this node type (child type: {@link SingleVariableDeclaration}).
     */
    public static final ChildPropertyDescriptor PARAMETER_PROPERTY
        = new ChildPropertyDescriptor(SingleVariableDeclaration.class, true);

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "body" structural property of this node type (child type: {@link Statement}).
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY = new ChildPropertyDescriptor(Statement.class, true);

    /**
     * The parameter; lazily initialized; defaults to a unspecified, legal node.
     */
    private SingleVariableDeclaration parameter;

    /**
     * The expression; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private Expression expression;

    /**
     * The body statement; lazily initialized; defaults to an empty block statement.
     */
    private Statement body;

    /**
     * Creates a new AST node for an enchanced for statement owned by the given AST. By default, the parameter and
     * expression are unspecified but legal subtrees, and the body is an empty block.
     *
     * @param ast the AST that is to own this node
     */
    EnhancedForStatement(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 70;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getParameter());
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getBody());
        }

    }

    /**
     * Returns the formal parameter in this enhanced for statement.
     *
     * @return the parameter
     */
    public SingleVariableDeclaration getParameter() {
        if (this.parameter == null) {
            this.parameter = postLazyInit(this.ast.newSingleVariableDeclaration(), PARAMETER_PROPERTY);
        }
        return this.parameter;
    }

    /**
     * Sets the formal parameter in this enhanced for statement.
     *
     * @param parameter the new parameter
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setParameter(SingleVariableDeclaration parameter) {

        ASTNode oldChild = this.parameter;
        preReplaceChild(oldChild, parameter, PARAMETER_PROPERTY);
        this.parameter = parameter;

    }

    /**
     * Returns the expression of this enhanced for statement.
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
     * Sets the expression of this enhanced for statement.
     *
     * @param expression the new expression node
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
     * Returns the body of this enchanced for statement.
     *
     * @return the body statement node
     */
    public Statement getBody() {
        if (this.body == null) {
            this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
        }
        return this.body;
    }

    /**
     * Sets the body of this enhanced for statement.
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
