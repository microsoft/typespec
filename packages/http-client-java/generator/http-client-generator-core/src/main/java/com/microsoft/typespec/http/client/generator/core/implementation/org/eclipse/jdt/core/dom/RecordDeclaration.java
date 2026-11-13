// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2019, 2021 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

/**
 * Record declaration AST node type (added in JLS16 API).
 *
 * <pre>
 * RecordDeclaration:
 *     [ Javadoc ] { ExtendedModifier } <b>record</b> Identifier
 *     		[ <b>&lt;</b> TypeParameter <b>&gt;</b> ]
 *     		<b>(</b>
 *          	[ FormalParameter { <b>,</b> FormalParameter } ]
 *        	<b>)</b> { Dimension }
 *     		[ <b>implements</b> Type { <b>,</b> Type } ]
 *         	[ <b>;</b> { RecordBodyDeclaration | <b>;</b> } ]
 * </pre>
 *
 * The {@link #bodyDeclarations()} list holds the class body declarations that appear after the semicolon. <p> When a
 * Javadoc comment is present, the source range begins with the first character of the "/**" comment delimiter. When
 * there is no Javadoc comment, the source range begins with the first character of the first modifier or annotation (if
 * present), or the first character of the "record" keyword (if no modifiers or annotations). The source range extends
 * through the last character of the "}" token following the body declarations. </p>
 *
 * @since 3.26
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class RecordDeclaration extends AbstractTypeDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY
        = internalJavadocPropertyFactory(RecordDeclaration.class);

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}).
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = internalModifiers2PropertyFactory(RecordDeclaration.class);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory(RecordDeclaration.class);

    /**
     * The "superInterfaceTypes" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor SUPER_INTERFACE_TYPES_PROPERTY
        = new ChildListPropertyDescriptor(RecordDeclaration.class, "superInterfaceTypes", Type.class, false); //$NON-NLS-1$

    /**
     * The "typeParameters" structural property of this node type (element type: {@link TypeParameter}).
     */
    public static final ChildListPropertyDescriptor TYPE_PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(RecordDeclaration.class, "typeParameters", TypeParameter.class, false); //$NON-NLS-1$

    /**
     * The "recordComponents" structural property of this node type (element type: {@link SingleVariableDeclaration}).
     */
    public static final ChildListPropertyDescriptor RECORD_COMPONENTS_PROPERTY = new ChildListPropertyDescriptor(
        RecordDeclaration.class, "recordComponents", SingleVariableDeclaration.class, false); //$NON-NLS-1$

    /**
     * The "bodyDeclarations" structural property of this node type (element type: {@link BodyDeclaration}).
     */
    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY
        = internalBodyDeclarationPropertyFactory(RecordDeclaration.class);

    /**
     * @since 3.26
     */
    public void setRestrictedIdentifierStartPosition(int restrictedIdentifierStartPosition) {
        if (restrictedIdentifierStartPosition < 0) {
            throw new IllegalArgumentException();
        }
        // restrictedIdentifierStartPosition is not considered a structural property
        // but we protect it nevertheless
        checkModifiable();
    }

    static {
        ArrayList propertyList = new ArrayList(8);
        createPropertyList(RecordDeclaration.class, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS2_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(TYPE_PARAMETERS_PROPERTY, propertyList);
        addProperty(RECORD_COMPONENTS_PROPERTY, propertyList);
        addProperty(SUPER_INTERFACE_TYPES_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);

        reapPropertyList(propertyList);
    }

    /**
     * The type parameters (element type: {@link TypeParameter}). defaults to an empty list
     */
    private final ASTNode.NodeList typeParameters = new ASTNode.NodeList(TYPE_PARAMETERS_PROPERTY);

    /**
     * The superinterface types (element type: {@link Type}). defaults to an empty list (see constructor).
     */
    private final ASTNode.NodeList superInterfaceTypes = new ASTNode.NodeList(SUPER_INTERFACE_TYPES_PROPERTY);

    /**
     * The parameters (element type: {@link SingleVariableDeclaration}). defaults to an empty list (see constructor).
     */
    private final ASTNode.NodeList recordComponents = new ASTNode.NodeList(RECORD_COMPONENTS_PROPERTY);

    /**
     * Creates a new AST node for a type declaration owned by the given AST. By default, the type declaration is for a
     * class of an unspecified, but legal, name; no modifiers; no javadoc; no type parameters; no superinterfaces; and
     * an empty list of body declarations. <p> N.B. This constructor is package-private; all subclasses must be declared
     * in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     * @exception UnsupportedOperationException if this operation is used below JLS16
     */
    RecordDeclaration(AST ast) {
        super(ast);
        unsupportedBelow16();
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
        return 103;
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
            acceptChildren(visitor, this.recordComponents);
            acceptChildren(visitor, this.superInterfaceTypes);
            acceptChildren(visitor, this.bodyDeclarations);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of type parameters of this type declaration (added in JLS3 API). This list is
     * non-empty for parameterized types.
     *
     * @return the live list of type parameters (element type: {@link TypeParameter})
     * @since 3.26
     */
    public List typeParameters() {
        return this.typeParameters;
    }

    /**
     * Returns the live ordered list of superinterfaces of this type declaration (added in JLS3 API). For a class
     * declaration, these are the interfaces that this class implements; for an interface declaration, these are the
     * interfaces that this interface extends.
     *
     * @return the live list of interface types (element type: {@link Type})
     * @since 3.26
     */
    public List superInterfaceTypes() {
        return this.superInterfaceTypes;
    }

    /**
     * Returns the live ordered list of recordComponents of record declaration.
     *
     * @return the live list of recordComponents (element type: {@link SingleVariableDeclaration})
     * @since 3.26
     */
    public List recordComponents() {
        return this.recordComponents;
    }

    @Override
    SimplePropertyDescriptor internalModifiersProperty() {
        // node type does not exist before JLS 16
        return null;
    }
}
