// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2013 IBM Corporation and others.
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

import java.util.List;

/**
 * Abstract subclass for type declaration, enum declaration, and annotation type declaration AST node types.
 *
 * <pre>
 * AbstractTypeDeclaration:
 * 		TypeDeclaration
 * 		EnumDeclaration
 * 		AnnotationTypeDeclaration
 * </pre>
 *
 * @since 3.0
 */
@SuppressWarnings("rawtypes")
public abstract class AbstractTypeDeclaration extends BodyDeclaration {

    /**
     * The type name; lazily initialized; defaults to a unspecified, legal Java class identifier.
     *
     * @since 2.0 (originally declared on {@link TypeDeclaration})
     */
    volatile SimpleName typeName;

    /**
     * The body declarations (element type: {@link BodyDeclaration}). Defaults to an empty list.
     *
     * @since 2.0 (originally declared on {@link TypeDeclaration})
     */
    ASTNode.NodeList bodyDeclarations;

    /**
     * Returns structural property descriptor for the "bodyDeclarations" property of this node (element type:
     * {@link BodyDeclaration}).
     *
     * @return the property descriptor
     */
    abstract ChildListPropertyDescriptor internalBodyDeclarationsProperty();

    /**
     * Returns structural property descriptor for the "name" property of this node (child type: {@link SimpleName}).
     *
     * @return the property descriptor
     */
    abstract ChildPropertyDescriptor internalNameProperty();

    /**
     * Creates and returns a structural property descriptor for the "bodyDeclaration" property declared on the given
     * concrete node type (element type: {@link BodyDeclaration}).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalBodyDeclarationPropertyFactory(Class nodeClass) {
        return new ChildListPropertyDescriptor(nodeClass, "bodyDeclarations", BodyDeclaration.class, true); //$NON-NLS-1$
    }

    /**
     * Creates and returns a structural property descriptor for the "name" property declared on the given concrete node
     * type (child type: {@link SimpleName}).
     *
     * @return the property descriptor
     */
    static ChildPropertyDescriptor internalNamePropertyFactory(Class nodeClass) {
        return new ChildPropertyDescriptor(nodeClass, "name", SimpleName.class, false); //$NON-NLS-1$
    }

    /**
     * Creates a new AST node for an abstract type declaration owned by the given AST. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    AbstractTypeDeclaration(AST ast) {
        super(ast);
        this.bodyDeclarations = new ASTNode.NodeList(internalBodyDeclarationsProperty());
    }

    /**
     * Returns the name of the type declared in this type declaration.
     *
     * @return the type name node
     * @since 2.0 (originally declared on {@link TypeDeclaration})
     */
    public SimpleName getName() {
        if (this.typeName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.typeName == null) {
                    this.typeName = postLazyInit(new SimpleName(this.ast), internalNameProperty());
                }
            }
        }
        return this.typeName;
    }

    /**
     * Sets the name of the type declared in this type declaration to the given name.
     *
     * @param typeName the new type name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 2.0 (originally declared on {@link TypeDeclaration})
     */
    public void setName(SimpleName typeName) {
        if (typeName == null) {
            throw new IllegalArgumentException();
        }
        ChildPropertyDescriptor p = internalNameProperty();
        ASTNode oldChild = this.typeName;
        preReplaceChild(oldChild, typeName, p);
        this.typeName = typeName;

    }

    /**
     * Returns the live ordered list of body declarations of this type declaration.
     *
     * @return the live list of body declarations (element type: {@link BodyDeclaration})
     * @since 2.0 (originally declared on {@link TypeDeclaration})
     */
    public List bodyDeclarations() {
        return this.bodyDeclarations;
    }

}
