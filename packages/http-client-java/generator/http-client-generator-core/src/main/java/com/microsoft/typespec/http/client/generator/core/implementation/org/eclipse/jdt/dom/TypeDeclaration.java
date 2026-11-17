// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Type declaration AST node type. A type declaration is the union of a class declaration and an interface declaration.
 *
 * <pre>
 * TypeDeclaration:
 * 		ClassDeclaration
 * 		InterfaceDeclaration
 * ClassDeclaration:
 *      [ Javadoc ] { ExtendedModifier } <b>class</b> Identifier
 *			[ <b>&lt;</b> TypeParameter { <b>,</b> TypeParameter } <b>&gt;</b> ]
 *			[ <b>extends</b> Type ]
 *			[ <b>implements</b> Type { <b>,</b> Type } ]
 *			[ <b>permits</b> Type { <b>,</b> Type } ]
 *			<b>{</b> { ClassBodyDeclaration | <b>;</b> } <b>}</b>
 * InterfaceDeclaration:
 *      [ Javadoc ] { ExtendedModifier } <b>interface</b> Identifier
 *			[ <b>&lt;</b> TypeParameter { <b>,</b> TypeParameter } <b>&gt;</b> ]
 *			[ <b>extends</b> Type { <b>,</b> Type } ]
 *			[ <b>permits</b> Type { <b>,</b> Type } ]
 * 			<b>{</b> { InterfaceBodyDeclaration | <b>;</b> } <b>}</b>
 * </pre>
 *
 * <p> When a Javadoc comment is present, the source range begins with the first character of the "/**" comment
 * delimiter. When there is no Javadoc comment, the source range begins with the first character of the first modifier
 * or annotation (if any), or the first character of the "class" or "interface" keyword (if no modifiers or
 * annotations). The source range extends through the last character of the "}" token following the body declarations.
 * </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class TypeDeclaration extends AbstractTypeDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory();

    /**
     * The "superclassType" structural property of this node type (child type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor SUPERCLASS_TYPE_PROPERTY
        = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "superInterfaceTypes" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor SUPER_INTERFACE_TYPES_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The "typeParameters" structural property of this node type (element type: {@link TypeParameter}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(TypeParameter.class, false);

    /**
     * The "bodyDeclarations" structural property of this node type (element type: {@link BodyDeclaration}) (added in
     * JLS3 API).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY
        = internalBodyDeclarationPropertyFactory();

    /**
     * <code>true</code> for an interface, <code>false</code> for a class. Defaults to class.
     */
    private boolean isInterface = false;

    /**
     * The type parameters (element type: {@link TypeParameter}). Null in JLS2. Added in JLS3; defaults to an empty list
     * (see constructor).
     *
     * @since 3.1
     */
    private ASTNode.NodeList typeParameters = null;

    /**
     * The optional superclass type; <code>null</code> if none. Defaults to none. Note that this field is not used for
     * interface declarations. Null in JLS2. Added in JLS3.
     *
     * @since 3.1
     */
    private Type optionalSuperclassType = null;

    /**
     * The superinterface types (element type: {@link Type}). Null in JLS2. Added in JLS3; defaults to an empty list
     * (see constructor).
     *
     * @since 3.1
     */
    private ASTNode.NodeList superInterfaceTypes = null;

    /**
     * Creates a new AST node for a type declaration owned by the given AST. By default, the type declaration is for a
     * class of an unspecified, but legal, name; no modifiers; no javadoc; no type parameters; no superclass or
     * superinterfaces; and an empty list of body declarations. <p> N.B. This constructor is package-private; all
     * subclasses must be declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    TypeDeclaration(AST ast) {
        super(ast);

        this.typeParameters = new ASTNode.NodeList(TYPE_PARAMETERS_PROPERTY);
        this.superInterfaceTypes = new ASTNode.NodeList(SUPER_INTERFACE_TYPES_PROPERTY);
    }

    @Override
    final ChildPropertyDescriptor internalJavadocProperty() {
        return JAVADOC_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalModifiers2Property() {
        return MODIFIERS2_PROPERTY;
    }

    @Override
    final ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalBodyDeclarationsProperty() {
        return BODY_DECLARATIONS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 55;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order

            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.typeParameters);
            acceptChild(visitor, getSuperclassType());
            acceptChildren(visitor, this.superInterfaceTypes);
            acceptChildren(visitor, this.bodyDeclarations);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns whether this type declaration declares a class or an interface.
     *
     * @return <code>true</code> if this is an interface declaration, and <code>false</code> if this is a class
     * declaration
     */
    public boolean isInterface() {
        return this.isInterface;
    }

    /**
     * Sets whether this type declaration declares a class or an interface.
     *
     * @param isInterface <code>true</code> if this is an interface declaration, and <code>false</code> if this is a
     * class declaration
     */
    public void setInterface(boolean isInterface) {
        preValueChange();
        this.isInterface = isInterface;

    }

    /**
     * Returns the live ordered list of type parameters of this type declaration (added in JLS3 API). This list is
     * non-empty for parameterized types.
     *
     * @return the live list of type parameters (element type: {@link TypeParameter})
     * @since 3.1
     */
    public List typeParameters() {
        // more efficient than just calling unsupportedIn2() to check

        return this.typeParameters;
    }

    /**
     * Returns the superclass declared in this type declaration, or <code>null</code> if there is none (added in JLS3
     * API). <p> Note that this child is not relevant for interface declarations (although it does still figure in
     * subtree equality comparisons). </p>
     *
     * @return the superclass type node, or <code>null</code> if there is none
     * @since 3.1
     */
    public Type getSuperclassType() {

        return this.optionalSuperclassType;
    }

    /**
     * Sets or clears the superclass declared in this type declaration (added in JLS3 API). <p> Note that this child is
     * not relevant for interface declarations (although it does still figure in subtree equality comparisons). </p>
     *
     * @param superclassType the superclass type node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 3.1
     */
    public void setSuperclassType(Type superclassType) {

        ASTNode oldChild = this.optionalSuperclassType;
        preReplaceChild(oldChild, superclassType, SUPERCLASS_TYPE_PROPERTY);
        this.optionalSuperclassType = superclassType;

    }

    /**
     * Returns the live ordered list of superinterfaces of this type declaration (added in JLS3 API). For a class
     * declaration, these are the interfaces that this class implements; for an interface declaration, these are the
     * interfaces that this interface extends.
     *
     * @return the live list of interface types (element type: {@link Type})
     * @since 3.1
     */
    public List superInterfaceTypes() {
        // more efficient than just calling unsupportedIn2() to check

        return this.superInterfaceTypes;
    }

}
