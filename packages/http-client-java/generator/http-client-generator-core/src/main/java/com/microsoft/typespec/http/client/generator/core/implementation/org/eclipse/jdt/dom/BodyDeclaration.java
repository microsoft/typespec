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
 * Abstract base class of all AST nodes that represent body declarations that may appear in the body of some kind of
 * class or interface declaration, including anonymous class declarations, enumeration declarations, and enumeration
 * constant declarations.
 *
 * <pre>
 * BodyDeclaration:
 *        {@link AbstractTypeDeclaration}
 *            {@link AnnotationTypeDeclaration}
 *            {@link EnumDeclaration}
 *            {@link TypeDeclaration} (for classes and interfaces)
 *        {@link AnnotationTypeMemberDeclaration}
 *        {@link EnumConstantDeclaration}
 *        {@link FieldDeclaration}
 *        {@link Initializer}
 *        {@link MethodDeclaration} (for methods and constructors)
 * </pre>
 *
 * <p> All types of body declarations carry modifiers (and annotations), although they differ in which modifiers are
 * allowed. Most types of body declarations can carry a doc comment; Initializer is the only ones that does not. The
 * source range for body declarations always includes the doc comment if present. </p>
 *
 * @since 2.0
 */
public abstract class BodyDeclaration extends ASTNode {

    /**
     * The doc comment, or <code>null</code> if none. Defaults to none.
     */
    Javadoc optionalDocComment = null;

    /**
     * The extended modifiers (element type: {@link IExtendedModifier}); defaults to an empty list (see constructor).
     *
     * @since 3.0
     */
    final ASTNode.NodeList<IExtendedModifier> modifiers;

    /**
     * Returns structural property descriptor for the "modifiers" property of this node as used in JLS3 (element type:
     * {@link IExtendedModifier}).
     *
     * @return the property descriptor
     */
    abstract ChildListPropertyDescriptor internalModifiers2Property();

    /**
     * Returns structural property descriptor for the "javadoc" property of this node (child type: {@link Javadoc}).
     *
     * @return the property descriptor
     */
    abstract ChildPropertyDescriptor internalJavadocProperty();

    /**
     * Creates and returns a structural property descriptor for the "javadoc" property declared on the given concrete
     * node type (child type: {@link Javadoc}).
     *
     * @return the property descriptor
     */
    static ChildPropertyDescriptor internalJavadocPropertyFactory() {
        return new ChildPropertyDescriptor(Javadoc.class, false);
    }

    /**
     * Creates and returns a structural property descriptor for the "modifiers" property declared on the given concrete
     * node type (element type: {@link IExtendedModifier}).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalModifiers2PropertyFactory() {
        return new ChildListPropertyDescriptor(IExtendedModifier.class, true);
    }

    /**
     * Creates a new AST node for a body declaration node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    BodyDeclaration(AST ast) {
        super(ast);
        this.modifiers = new ASTNode.NodeList<>(internalModifiers2Property());
    }

    /**
     * Returns the doc comment node.
     *
     * @return the doc comment node, or <code>null</code> if none
     */
    public Javadoc getJavadoc() {
        return this.optionalDocComment;
    }

    /**
     * Sets or clears the doc comment node.
     *
     * @param docComment the doc comment node, or <code>null</code> if none
     * @exception IllegalArgumentException if the doc comment string is invalid
     */
    public void setJavadoc(Javadoc docComment) {
        ChildPropertyDescriptor p = internalJavadocProperty();
        ASTNode oldChild = this.optionalDocComment;
        preReplaceChild(oldChild, docComment, p);
        this.optionalDocComment = docComment;

    }

    /**
     * Returns the live ordered list of modifiers and annotations of this declaration (added in JLS3 API).
     *
     * @return the live list of modifiers and annotations (element type: {@link IExtendedModifier})
     * @since 3.1
     */
    public List<IExtendedModifier> modifiers() {
        return this.modifiers;
    }
}
