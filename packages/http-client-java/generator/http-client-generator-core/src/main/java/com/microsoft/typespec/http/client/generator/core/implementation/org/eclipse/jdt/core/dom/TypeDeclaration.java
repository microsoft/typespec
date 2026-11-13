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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.util.DOMASTUtil;
import java.util.ArrayList;
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
@SuppressWarnings({ "rawtypes", "unchecked" })
public class TypeDeclaration extends AbstractTypeDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY
        = internalJavadocPropertyFactory(TypeDeclaration.class);

    /**
     * The "modifiers" structural property of this node type (type: {@link Integer}) (JLS2 API only).
     *
     * @deprecated In the JLS3 API, this property is replaced by {@link #MODIFIERS2_PROPERTY}.
     * @since 3.0
     */
    public static final SimplePropertyDescriptor MODIFIERS_PROPERTY
        = internalModifiersPropertyFactory(TypeDeclaration.class);

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = internalModifiers2PropertyFactory(TypeDeclaration.class);

    /**
     * The "interface" structural property of this node type (type: {@link Boolean}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor INTERFACE_PROPERTY
        = new SimplePropertyDescriptor(TypeDeclaration.class, "interface", boolean.class); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory(TypeDeclaration.class);

    /**
     * The "superclass" structural property of this node type (child type: {@link Name}) (JLS2 API only).
     *
     * @since 3.0
     * @deprecated In the JLS3 API, this property is replaced by {@link #SUPERCLASS_TYPE_PROPERTY}.
     */
    public static final ChildPropertyDescriptor SUPERCLASS_PROPERTY
        = new ChildPropertyDescriptor(TypeDeclaration.class, "superclass", Name.class, false); //$NON-NLS-1$

    /**
     * The "superInterfaces" structural property of this node type (element type: {@link Name}) (JLS2 API only).
     *
     * @since 3.0
     * @deprecated In the JLS3 API, this property is replaced by {@link #SUPER_INTERFACE_TYPES_PROPERTY}.
     */
    public static final ChildListPropertyDescriptor SUPER_INTERFACES_PROPERTY
        = new ChildListPropertyDescriptor(TypeDeclaration.class, "superInterfaces", Name.class, false); //$NON-NLS-1$

    /**
     * The "superclassType" structural property of this node type (child type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor SUPERCLASS_TYPE_PROPERTY
        = new ChildPropertyDescriptor(TypeDeclaration.class, "superclassType", Type.class, false); //$NON-NLS-1$

    /**
     * The "superInterfaceTypes" structural property of this node type (element type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor SUPER_INTERFACE_TYPES_PROPERTY
        = new ChildListPropertyDescriptor(TypeDeclaration.class, "superInterfaceTypes", Type.class, false); //$NON-NLS-1$

    /**
     * The "typeParameters" structural property of this node type (element type: {@link TypeParameter}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(TypeDeclaration.class, "typeParameters", TypeParameter.class, false); //$NON-NLS-1$

    /**
     * The "bodyDeclarations" structural property of this node type (element type: {@link BodyDeclaration}) (added in
     * JLS3 API).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY
        = internalBodyDeclarationPropertyFactory(TypeDeclaration.class);

    /**
     * The "permitsTypes" structural property of this node type (element type: {@link Type}) (added in JLS15 API).
     *
     * @since 3.24
     */
    public static final ChildListPropertyDescriptor PERMITS_TYPES_PROPERTY
        = new ChildListPropertyDescriptor(TypeDeclaration.class, "permitsTypes", Type.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(8);
        createPropertyList(TypeDeclaration.class, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS_PROPERTY, propertyList);
        addProperty(INTERFACE_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(SUPERCLASS_PROPERTY, propertyList);
        addProperty(SUPER_INTERFACES_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(9);
        createPropertyList(TypeDeclaration.class, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS2_PROPERTY, propertyList);
        addProperty(INTERFACE_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(TYPE_PARAMETERS_PROPERTY, propertyList);
        addProperty(SUPERCLASS_TYPE_PROPERTY, propertyList);
        addProperty(SUPER_INTERFACE_TYPES_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(10);
        createPropertyList(TypeDeclaration.class, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS2_PROPERTY, propertyList);
        addProperty(INTERFACE_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(TYPE_PARAMETERS_PROPERTY, propertyList);
        addProperty(SUPERCLASS_TYPE_PROPERTY, propertyList);
        addProperty(SUPER_INTERFACE_TYPES_PROPERTY, propertyList);
        addProperty(PERMITS_TYPES_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

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
     * The optional superclass name; <code>null</code> if none. Defaults to none. Note that this field is not used for
     * interface declarations. Not used in 3.0.
     */
    private Name optionalSuperclassName = null;

    /**
     * The superinterface names (element type: {@link Name}). JLS2 only; defaults to an empty list. Not used in JLS3.
     * (see constructor).
     */
    private ASTNode.NodeList superInterfaceNames = null;

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
     * The permits types (element type: {@link Type}). Not Null from Java 15 with oreview; defaults to an empty list
     * (see constructor).
     *
     * @since 3.22
     */
    private ASTNode.NodeList permittedTypes = null;

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
        if (ast.apiLevel == 2) {
            this.superInterfaceNames = new ASTNode.NodeList(SUPER_INTERFACES_PROPERTY);
        }
        if (ast.apiLevel >= 3) {
            this.typeParameters = new ASTNode.NodeList(TYPE_PARAMETERS_PROPERTY);
            this.superInterfaceTypes = new ASTNode.NodeList(SUPER_INTERFACE_TYPES_PROPERTY);
        }
        if (DOMASTUtil.isFeatureSupportedinAST(ast)) {
            this.permittedTypes = new ASTNode.NodeList(PERMITS_TYPES_PROPERTY);
        }
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
    final SimplePropertyDescriptor internalModifiersProperty() {
        return MODIFIERS_PROPERTY;
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
            if (this.ast.apiLevel == 2) {
                acceptChild(visitor, getJavadoc());
                acceptChild(visitor, getName());
                acceptChild(visitor, getSuperclass());
                acceptChildren(visitor, this.superInterfaceNames);
                acceptChildren(visitor, this.bodyDeclarations);
            }
            if (this.ast.apiLevel >= 3) {
                acceptChild(visitor, getJavadoc());
                acceptChildren(visitor, this.modifiers);
                acceptChild(visitor, getName());
                acceptChildren(visitor, this.typeParameters);
                acceptChild(visitor, getSuperclassType());
                acceptChildren(visitor, this.superInterfaceTypes);
                acceptChildren(visitor, this.bodyDeclarations);
            }
            if (DOMASTUtil.isFeatureSupportedinAST(getAST())) {
                acceptChildren(visitor, this.permittedTypes);
            }
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
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public List typeParameters() {
        // more efficient than just calling unsupportedIn2() to check
        if (this.typeParameters == null) {
            unsupportedIn2();
        }
        return this.typeParameters;
    }

    /**
     * Returns the name of the superclass declared in this type declaration, or <code>null</code> if there is none (JLS2
     * API only). <p> Note that this child is not relevant for interface declarations (although it does still figure in
     * subtree equality comparisons). </p>
     *
     * @return the superclass name node, or <code>null</code> if there is none
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @deprecated In the JLS3 API, this method is replaced by {@link #getSuperclassType()}, which returns a
     * <code>Type</code> instead of a <code>Name</code>.
     */
    public Name getSuperclass() {
        return internalGetSuperclass();
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ final Name internalGetSuperclass() {
        supportedOnlyIn2();
        return this.optionalSuperclassName;
    }

    /**
     * Returns the superclass declared in this type declaration, or <code>null</code> if there is none (added in JLS3
     * API). <p> Note that this child is not relevant for interface declarations (although it does still figure in
     * subtree equality comparisons). </p>
     *
     * @return the superclass type node, or <code>null</code> if there is none
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public Type getSuperclassType() {
        unsupportedIn2();
        return this.optionalSuperclassType;
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ final void internalSetSuperclass(Name superclassName) {
        supportedOnlyIn2();
        ASTNode oldChild = this.optionalSuperclassName;
        preReplaceChild(oldChild, superclassName, SUPERCLASS_PROPERTY);
        this.optionalSuperclassName = superclassName;

    }

    /**
     * Sets or clears the superclass declared in this type declaration (added in JLS3 API). <p> Note that this child is
     * not relevant for interface declarations (although it does still figure in subtree equality comparisons). </p>
     *
     * @param superclassType the superclass type node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public void setSuperclassType(Type superclassType) {
        unsupportedIn2();
        ASTNode oldChild = this.optionalSuperclassType;
        preReplaceChild(oldChild, superclassType, SUPERCLASS_TYPE_PROPERTY);
        this.optionalSuperclassType = superclassType;

    }

    /**
     * Returns the live ordered list of names of superinterfaces of this type declaration (JLS2 API only). For a class
     * declaration, these are the names of the interfaces that this class implements; for an interface declaration,
     * these are the names of the interfaces that this interface extends.
     *
     * @return the live list of interface names (element type: {@link Name})
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @deprecated In the JLS3 API, this method is replaced by {@link #superInterfaceTypes()}.
     */
    public List superInterfaces() {
        return internalSuperInterfaces();
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ final List internalSuperInterfaces() {
        // more efficient than just calling supportedOnlyIn2() to check
        if (this.superInterfaceNames == null) {
            supportedOnlyIn2();
        }
        return this.superInterfaceNames;
    }

    /**
     * Returns the live ordered list of superinterfaces of this type declaration (added in JLS3 API). For a class
     * declaration, these are the interfaces that this class implements; for an interface declaration, these are the
     * interfaces that this interface extends.
     *
     * @return the live list of interface types (element type: {@link Type})
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public List superInterfaceTypes() {
        // more efficient than just calling unsupportedIn2() to check
        if (this.superInterfaceTypes == null) {
            unsupportedIn2();
        }
        return this.superInterfaceTypes;
    }

    /**
     * Returns the live ordered list of permits of this type declaration (added in JLS17 API). For a type declaration,
     * these are the permitted types which can implement/extend this sealed type.
     *
     *
     * @return the live list of types (element type: {@link Type})
     * @exception UnsupportedOperationException if this operation is not used with Java 17 and above
     * @since 3.27
     */
    public List permittedTypes() {
        // more efficient than just calling unsupportedIn2() to check
        if (this.permittedTypes == null) {
            unsupportedBelow17();
        }
        return this.permittedTypes;
    }

    /**
     * A character index into the original restricted identifier source string, or <code>-1</code> if no restricted
     * identifier source position information is available for this node; <code>-1</code> by default.
     *
     * @since 3.28
     */
    public void setRestrictedIdentifierStartPosition(int restrictedIdentifierStartPosition) {
        if (restrictedIdentifierStartPosition < 0) {
            throw new IllegalArgumentException();
        }
        // restrictedIdentifierStartPosition is not considered a structural property
        // but we protect it nevertheless
        checkModifiable();
    }
}
