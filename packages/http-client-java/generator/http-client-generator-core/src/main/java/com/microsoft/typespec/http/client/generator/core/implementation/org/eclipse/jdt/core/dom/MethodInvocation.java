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
import java.util.List;

/**
 * Method invocation expression AST node type.
 *
 * <pre>
 * MethodInvocation:
 *     [ Expression <b>.</b> ]
 *         [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *         Identifier <b>(</b> [ Expression { <b>,</b> Expression } ] <b>)</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class MethodInvocation extends Expression {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(MethodInvocation.class, "expression", Expression.class, true); //$NON-NLS-1$

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(MethodInvocation.class, "typeArguments", Type.class, false); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(MethodInvocation.class, "name", SimpleName.class, false); //$NON-NLS-1$

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(MethodInvocation.class, "arguments", Expression.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(4);
        createPropertyList(MethodInvocation.class, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(5);
        createPropertyList(MethodInvocation.class, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The expression; <code>null</code> for none; defaults to none.
     */
    private Expression optionalExpression = null;

    /**
     * The type arguments (element type: {@link Type}). Null in JLS2. Added in JLS3; defaults to an empty list (see
     * constructor).
     *
     * @since 3.1
     */
    private ASTNode.NodeList typeArguments = null;

    /**
     * The method name; lazily initialized; defaults to a unspecified, legal Java method name.
     */
    private volatile SimpleName methodName;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList arguments = new ASTNode.NodeList(ARGUMENTS_PROPERTY);

    /**
     * Creates a new AST node for a method invocation expression owned by the given AST. By default, no expression, no
     * type arguments, an unspecified, but legal, method name, and an empty list of arguments.
     *
     * @param ast the AST that is to own this node
     */
    MethodInvocation(AST ast) {
        super(ast);
        if (ast.apiLevel >= 3) {
            this.typeArguments = new ASTNode.NodeList(TYPE_ARGUMENTS_PROPERTY);
        }
    }

    @Override
    final int getNodeType0() {
        return 32;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            if (this.ast.apiLevel >= 3) {
                acceptChildren(visitor, this.typeArguments);
            }
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.arguments);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the expression of this method invocation expression, or <code>null</code> if there is none.
     *
     * @return the expression node, or <code>null</code> if there is none
     */
    public Expression getExpression() {
        return this.optionalExpression;
    }

    /**
     * Sets or clears the expression of this method invocation expression.
     *
     * @param expression the expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        ASTNode oldChild = this.optionalExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.optionalExpression = expression;

    }

    /**
     * Returns the live ordered list of type arguments of this method invocation (added in JLS3 API).
     *
     * @return the live list of type arguments (element type: {@link Type})
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public List typeArguments() {
        // more efficient than just calling unsupportedIn2() to check
        if (this.typeArguments == null) {
            unsupportedIn2();
        }
        return this.typeArguments;
    }

    /**
     * Returns the name of the method invoked in this expression.
     *
     * @return the method name node
     */
    public SimpleName getName() {
        if (this.methodName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.methodName == null) {
                    this.methodName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
        }
        return this.methodName;
    }

    /**
     * Sets the name of the method invoked in this expression to the given name.
     *
     * @param name the new method name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.methodName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.methodName = name;

    }

    /**
     * Returns the live ordered list of argument expressions in this method invocation expression.
     *
     * @return the live list of argument expressions (element type: {@link Expression})
     */
    public List arguments() {
        return this.arguments;
    }
}
