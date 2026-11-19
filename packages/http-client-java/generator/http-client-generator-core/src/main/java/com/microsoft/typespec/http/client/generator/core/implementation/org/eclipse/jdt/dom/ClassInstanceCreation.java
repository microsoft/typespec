// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Class instance creation expression AST node type.
 *
 * <pre>
 * ClassInstanceCreation:
 *        [ Expression <b>.</b> ]
 *            <b>new</b> [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *            Type <b>(</b> [ Expression { <b>,</b> Expression } ] <b>)</b>
 *            [ AnonymousClassDeclaration ]
 * </pre>
 *
 * <p> Not all node arrangements will represent legal Java constructs. In particular, it is nonsense if the type is a
 * primitive type or an array type (primitive types cannot be instantiated, and array creations must be represented with
 * <code>ArrayCreation</code> nodes). The normal use is when the type is a simple, qualified, or parameterized type.
 * </p> <p> {@link QualifiedType} discusses typical representations of qualified type references. </p>
 *
 * @since 2.0
 */
public class ClassInstanceCreation extends Expression {

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "type" structural property of this node type (child type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The "anonymousClassDeclaration" structural property of this node type (child type:
     * {@link AnonymousClassDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor ANONYMOUS_CLASS_DECLARATION_PROPERTY
        = new ChildPropertyDescriptor(AnonymousClassDeclaration.class, true);

    /**
     * The optional expression; <code>null</code> for none; defaults to none.
     */
    private Expression optionalExpression = null;

    /**
     * The type arguments (element type: {@link Type}). Null in JLS2. Added in JLS3; defaults to an empty list (see
     * constructor).
     *
     * @since 3.1
     */
    private final ASTNode.NodeList<Type> typeArguments;

    /**
     * The type; lazily initialized; defaults to a unspecified type.
     *
     * @since 3.0
     */
    private Type type;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Expression> arguments = new ASTNode.NodeList<>(ARGUMENTS_PROPERTY);

    /**
     * The optional anonymous class declaration; <code>null</code> for none; defaults to none.
     */
    private AnonymousClassDeclaration optionalAnonymousClassDeclaration = null;

    /**
     * Creates a new AST node for a class instance creation expression owned by the given AST. By default, there is no
     * qualifying expression, an empty list of type parameters, an unspecified type, an empty list of arguments, and
     * does not declare an anonymous class. <p> N.B. This constructor is package-private; all subclasses must be
     * declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ClassInstanceCreation(AST ast) {
        super(ast);
        this.typeArguments = new ASTNode.NodeList<>(TYPE_ARGUMENTS_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 14;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());

            acceptChildren(visitor, this.typeArguments);
            acceptChild(visitor, getType());
            acceptChildren(visitor, this.arguments);
            acceptChild(visitor, getAnonymousClassDeclaration());
        }

    }

    /**
     * Returns the expression of this class instance creation expression, or <code>null</code> if there is none.
     *
     * @return the expression node, or <code>null</code> if there is none
     */
    public Expression getExpression() {
        return this.optionalExpression;
    }

    /**
     * Sets or clears the expression of this class instance creation expression.
     *
     * @param expression the expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        // a ClassInstanceCreation may occur inside an Expression
        // must check cycles
        ASTNode oldChild = this.optionalExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.optionalExpression = expression;

    }

    /**
     * Returns the live ordered list of type arguments of this class instance creation (added in JLS3 API).
     *
     * @return the live list of type arguments (element type: {@link Type})
     * @since 3.1
     */
    public List<Type> typeArguments() {
        return this.typeArguments;
    }

    /**
     * Returns the type instantiated in this class instance creation expression (added in JLS3 API).
     *
     * @return the type node
     * @since 3.1
     */
    public Type getType() {

        if (this.type == null) {
            this.type = postLazyInit(new SimpleType(this.ast), TYPE_PROPERTY);
        }
        return this.type;
    }

    /**
     * Sets the type instantiated in this class instance creation expression (added in JLS3 API).
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 3.1
     */
    public void setType(Type type) {

        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.type;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.type = type;

    }

    /**
     * Returns the live ordered list of argument expressions in this class instance creation expression.
     *
     * @return the live list of argument expressions (possibly empty) (element type: {@link Expression})
     */
    public List<Expression> arguments() {
        return this.arguments;
    }

    /**
     * Returns the anonymous class declaration introduced by this class instance creation expression, if it has one.
     *
     * @return the anonymous class declaration, or <code>null</code> if none
     */
    public AnonymousClassDeclaration getAnonymousClassDeclaration() {
        return this.optionalAnonymousClassDeclaration;
    }

    /**
     * Sets whether this class instance creation expression declares an anonymous class (that is, has class body
     * declarations).
     *
     * @param decl the anonymous class declaration, or <code>null</code> if none
     */
    public void setAnonymousClassDeclaration(AnonymousClassDeclaration decl) {
        ASTNode oldChild = this.optionalAnonymousClassDeclaration;
        preReplaceChild(oldChild, decl, ANONYMOUS_CLASS_DECLARATION_PROPERTY);
        this.optionalAnonymousClassDeclaration = decl;

    }
}
