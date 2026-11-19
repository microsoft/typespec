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
 * Simple or qualified "super" method invocation expression AST node type.
 *
 * <pre>
 * SuperMethodInvocation:
 *     [ ClassName <b>.</b> ] <b>super</b> <b>.</b>
 *         [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *         Identifier <b>(</b> [ Expression { <b>,</b> Expression } ] <b>)</b>
 * </pre>
 *
 * @since 2.0
 */
public class SuperMethodInvocation extends Expression {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The optional qualifier; <code>null</code> for none; defaults to none.
     */
    private Name optionalQualifier = null;

    /**
     * The type arguments (element type: {@link Type}). Null in JLS2. Added in JLS3; defaults to an empty list (see
     * constructor).
     *
     * @since 3.1
     */
    private final ASTNode.NodeList<Type> typeArguments;

    /**
     * The method name; lazily initialized; defaults to a unspecified, legal Java method name.
     */
    private SimpleName methodName;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Expression> arguments = new ASTNode.NodeList<>(ARGUMENTS_PROPERTY);

    /**
     * Creates a new AST node for a "super" method invocation expression owned by the given AST. By default, no
     * qualifier, no type arguments, an unspecified, but legal, method name, and an empty list of arguments.
     *
     * @param ast the AST that is to own this node
     */
    SuperMethodInvocation(AST ast) {
        super(ast);
        this.typeArguments = new ASTNode.NodeList<>(TYPE_ARGUMENTS_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 48;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getQualifier());
            acceptChildren(visitor, this.typeArguments);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.arguments);
        }

    }

    /**
     * Returns the qualifier of this "super" method invocation expression, or <code>null</code> if there is none.
     *
     * @return the qualifier name node, or <code>null</code> if there is none
     */
    public Name getQualifier() {
        return this.optionalQualifier;
    }

    /**
     * Sets or clears the qualifier of this "super" method invocation expression.
     *
     * @param name the qualifier name node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setQualifier(Name name) {
        ASTNode oldChild = this.optionalQualifier;
        preReplaceChild(oldChild, name, QUALIFIER_PROPERTY);
        this.optionalQualifier = name;

    }

    /**
     * Returns the live ordered list of type arguments of this method invocation (added in JLS3 API).
     *
     * @return the live list of type arguments (element type: {@link Type})
     * @since 3.1
     */
    public List<Type> typeArguments() {
        return this.typeArguments;
    }

    /**
     * Returns the name of the method invoked in this expression.
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
     * Sets the name of the method invoked in this expression to the given name.
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

    /**
     * Returns the live ordered list of argument expressions in this "super" method invocation expression.
     *
     * @return the live list of argument expressions (element type: {@link Expression})
     */
    public List<Expression> arguments() {
        return this.arguments;
    }
}
