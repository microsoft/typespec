// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2014 IBM Corporation and others.
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
 * Single variable declaration AST node type. Single variable declaration nodes are used in a limited number of places,
 * including formal parameter lists and catch clauses. They are not used for field declarations and regular variable
 * declaration statements.
 *
 * <pre>
 * SingleVariableDeclaration:
 *    { ExtendedModifier } Type {Annotation} [ <b>...</b> ] Identifier { Dimension } [ <b>=</b> Expression ]
 * </pre>
 *
 * <p> Note: There's currently no construct in the Java language that allows an initializer on a
 * SingleVariableDeclaration. </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class SingleVariableDeclaration extends VariableDeclaration {

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = new ChildListPropertyDescriptor(IExtendedModifier.class, true);

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "varargsAnnotations" structural property of variable arguments of this node type (element type:
     * {@link Annotation}) (added in JLS8 API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor VARARGS_ANNOTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(Annotation.class, true);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory();

    /**
     * The "extraDimensions2" structural property of this node type (element type: {@link Dimension}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor EXTRA_DIMENSIONS2_PROPERTY
        = internalExtraDimensions2PropertyFactory();

    /**
     * The "initializer" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor INITIALIZER_PROPERTY = internalInitializerPropertyFactory();

    /**
     * The extended modifiers (element type: {@link IExtendedModifier}). Null in JLS2. Added in JLS3; defaults to an
     * empty list (see constructor).
     *
     * @since 3.1
     */
    private ASTNode.NodeList modifiers = null;

    /**
     * The type; lazily initialized; defaults to an unspecified, legal type.
     */
    private Type type;

    /**
     * The type annotations on the varargs token (element type: {@link Annotation}). Null before JLS8. Added in JLS8;
     * defaults to an empty list (see constructor).
     *
     * @since 3.10
     */
    private ASTNode.NodeList varargsAnnotations = null;

    /**
     * Indicates the last parameter of a variable arity method; defaults to false.
     *
     * @since 3.1
     */
    private boolean variableArity = false;

    /**
     * Creates a new AST node for a variable declaration owned by the given AST. By default, the variable declaration
     * has: no modifiers, an unspecified (but legal) type, an unspecified (but legal) variable name, 0 dimensions after
     * the variable; no initializer; not variable arity. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    SingleVariableDeclaration(AST ast) {
        super(ast);
        this.modifiers = new ASTNode.NodeList(MODIFIERS2_PROPERTY);
        this.varargsAnnotations = new ASTNode.NodeList(VARARGS_ANNOTATIONS_PROPERTY);
    }

    @Override
    final ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalExtraDimensions2Property() {
        return EXTRA_DIMENSIONS2_PROPERTY;
    }

    @Override
    final ChildPropertyDescriptor internalInitializerProperty() {
        return INITIALIZER_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 44;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getType());
            if (isVarargs()) {
                acceptChildren(visitor, this.varargsAnnotations);
            }
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.extraDimensions);
            acceptChild(visitor, getInitializer());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of modifiers and annotations of this declaration (added in JLS3 API). <p> Note that
     * the final modifier is the only meaningful modifier for local variable and formal parameter declarations. </p>
     *
     * @return the live list of modifiers and annotations (element type: {@link IExtendedModifier})
     * @since 3.1
     */
    public List modifiers() {
        // more efficient than just calling unsupportedIn2() to check

        return this.modifiers;
    }

    /**
     * Returns the type of the variable declared in this variable declaration, exclusive of any extra array dimensions
     * or the varargs dimension. <p> WARNING: For array-typed varargs, the binding of the
     * returned <code>Type</code> is not useful, since it represents an unused type. It misses the last (innermost)
     * dimension that carries the {@link #varargsAnnotations()}. </p>
     *
     * @return the type
     */
    public Type getType() {
        if (this.type == null) {
            this.type = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
        }
        return this.type;
    }

    /**
     * Sets the type of the variable declared in this variable declaration to the given type, exclusive of any extra
     * array dimensions.
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
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
     * Returns whether this declaration declares the last parameter of a variable arity method (added in JLS3 API). <p>
     * Note that the binding for the type <code>Foo</code> in the vararg method declaration <code>void fun(Foo...
     * args)</code> is always for the type as written; i.e., the type binding for <code>Foo</code>. However, if you
     * navigate from the method declaration to its method binding to the type binding for its last parameter, the type
     * binding for the vararg parameter is always an array type (i.e., <code>Foo[]</code>) reflecting the way vararg
     * methods get compiled. </p> <p> WARNING: For array-typed varargs, the binding of the
     * variable's {@link #getType() type} is not useful, since it represents an unused type. It misses the last
     * (innermost) dimension that carries the {@link #varargsAnnotations()}. </p>
     *
     * @return <code>true</code> if this is a variable arity parameter declaration, and <code>false</code> otherwise
     * @since 3.1
     */
    public boolean isVarargs() {
        // more efficient than just calling unsupportedIn2() to check

        return this.variableArity;
    }

    /**
     * Sets whether this declaration declares the last parameter of a variable arity method (added in JLS3 API).
     *
     * @since 3.1
     */
    public void setVarargs() {

        // more efficient than just calling unsupportedIn2() to check

        preValueChange();
        this.variableArity = true;

    }

    /**
     * Returns the ordered list of annotations on the varargs token (added in JLS8 API). <p> WARNING: For array-typed
     * varargs, the binding of the variable's {@link #getType() type} is not useful, since
     * it represents an unused type. It misses the last (innermost) dimension that carries the returned
     * {@code varargsAnnotations}. </p>
     *
     * @return the list of annotations on the varargs token (element type: {@link Annotation})
     * @see #isVarargs()
     * @since 3.10
     */
    public List varargsAnnotations() {

        return this.varargsAnnotations;
    }
}
