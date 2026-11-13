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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class ClassInstanceCreation extends Expression {

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(ClassInstanceCreation.class, "typeArguments", Type.class, false); //$NON-NLS-1$

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(ClassInstanceCreation.class, "expression", Expression.class, true); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link Name}) (JLS2 API only).
     *
     * @since 3.0
     * @deprecated In the JLS3 API, this property is replaced by {@link #TYPE_PROPERTY}.
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(ClassInstanceCreation.class, "name", Name.class, false); //$NON-NLS-1$

    /**
     * The "type" structural property of this node type (child type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY
        = new ChildPropertyDescriptor(ClassInstanceCreation.class, "type", Type.class, false); //$NON-NLS-1$

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(ClassInstanceCreation.class, "arguments", Expression.class, true); //$NON-NLS-1$

    /**
     * The "anonymousClassDeclaration" structural property of this node type (child type:
     * {@link AnonymousClassDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor ANONYMOUS_CLASS_DECLARATION_PROPERTY
        = new ChildPropertyDescriptor(ClassInstanceCreation.class, "anonymousClassDeclaration", //$NON-NLS-1$
            AnonymousClassDeclaration.class, true);

    static {
        List properyList = new ArrayList(5);
        createPropertyList(ClassInstanceCreation.class, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        addProperty(ANONYMOUS_CLASS_DECLARATION_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(6);
        createPropertyList(ClassInstanceCreation.class, properyList);
        addProperty(EXPRESSION_PROPERTY, properyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, properyList);
        addProperty(TYPE_PROPERTY, properyList);
        addProperty(ARGUMENTS_PROPERTY, properyList);
        addProperty(ANONYMOUS_CLASS_DECLARATION_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

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
    private ASTNode.NodeList typeArguments = null;

    /**
     * The type name; lazily initialized; defaults to a unspecified, legal type name. Not used in JLS3.
     */
    private volatile Name typeName;

    /**
     * The type; lazily initialized; defaults to a unspecified type.
     *
     * @since 3.0
     */
    private volatile Type type;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList arguments = new ASTNode.NodeList(ARGUMENTS_PROPERTY);

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
        if (ast.apiLevel >= 3) {
            this.typeArguments = new ASTNode.NodeList(TYPE_ARGUMENTS_PROPERTY);
        }
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
            if (this.ast.apiLevel == 2) {
                acceptChild(visitor, getName());
            }
            if (this.ast.apiLevel >= 3) {
                acceptChildren(visitor, this.typeArguments);
                acceptChild(visitor, getType());
            }
            acceptChildren(visitor, this.arguments);
            acceptChild(visitor, getAnonymousClassDeclaration());
        }
        visitor.endVisit(this);
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
     * Returns the name of the type instantiated in this class instance creation expression (JLS2 API only).
     *
     * @return the type name node
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @deprecated In the JLS3 API, this method is replaced by {@link #getType()}, which returns a <code>Type</code>
     * instead of a <code>Name</code>.
     */
    public Name getName() {
        return internalGetName();
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ Name internalGetName() {
        supportedOnlyIn2();
        if (this.typeName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.typeName == null) {
                    this.typeName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
        }
        return this.typeName;
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ void internalSetName(Name name) {
        supportedOnlyIn2();
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.typeName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.typeName = name;

    }

    /**
     * Returns the type instantiated in this class instance creation expression (added in JLS3 API).
     *
     * @return the type node
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public Type getType() {
        unsupportedIn2();
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(new SimpleType(this.ast), TYPE_PROPERTY);
                }
            }
        }
        return this.type;
    }

    /**
     * Sets the type instantiated in this class instance creation expression (added in JLS3 API).
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public void setType(Type type) {
        unsupportedIn2();
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
    public List arguments() {
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
