// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
 * Expression method reference AST node type (added in JLS8 API).
 *
 * <pre>
 * ExpressionMethodReference:
 *     Expression <b>::</b>
 *         [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *         Identifier
 * </pre>
 *
 * @since 3.10
 */
public class ExpressionMethodReference extends MethodReference {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type})
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY = internalTypeArgumentsFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The expression; lazily initialized; defaults to an unspecified, legal expression.
     */
    private Expression expression;

    /**
     * The method name; lazily initialized; defaults to an unspecified, legal Java method name.
     */
    private SimpleName methodName;

    /**
     * Creates a new AST node for an ExpressionMethodReference declaration owned by the given AST. <p> N.B. This
     * constructor is package-private; all subclasses must be declared in the same package; clients are unable to
     * declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ExpressionMethodReference(AST ast) {
        super(ast);

    }

    @Override
    final ChildListPropertyDescriptor internalTypeArgumentsProperty() {
        return TYPE_ARGUMENTS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 90;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChildren(visitor, this.typeArguments);
            acceptChild(visitor, getName());
        }

    }

    /**
     * Returns the expression of this expression method reference expression
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
     * Sets the expression of this expression method reference.
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
     * Returns the live ordered list of type arguments of this expression method reference
     *
     * @return the live list of type arguments (element type: {@link Type})
     */

    public List<Type> typeArguments() {
        return this.typeArguments;
    }

    /**
     * Returns the name of the method referenced in this expression.
     *
     * @return the method name node
     */
    public SimpleName getName() {
        if (this.methodName == null) {
            this.methodName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.methodName;
    }

    /**
     * Sets the name of the method referenced in this expression to the given name.
     *
     * @param name the new method name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {

        ASTNode oldChild = this.methodName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.methodName = name;

    }
}
