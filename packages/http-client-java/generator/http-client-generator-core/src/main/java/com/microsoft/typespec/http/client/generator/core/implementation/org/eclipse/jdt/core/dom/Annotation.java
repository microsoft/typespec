// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2019 IBM Corporation and others.
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

/**
 * Abstract base class of AST nodes that represent annotations.
 *
 * <pre>
 * Annotation:
 *		NormalAnnotation
 *		MarkerAnnotation
 *		SingleMemberAnnotation
 * </pre>
 *
 * @since 3.1
 */
@SuppressWarnings("rawtypes")
public abstract class Annotation extends Expression implements IExtendedModifier {

    /**
     * Returns structural property descriptor for the "typeName" property of this node (child type: {@link Name}).
     *
     * @return the property descriptor
     */
    abstract ChildPropertyDescriptor internalTypeNameProperty();

    /**
     * Creates and returns a structural property descriptor for the "typeName" property declared on the given concrete
     * node type (child type: {@link Name}).
     *
     * @return the property descriptor
     */
    static ChildPropertyDescriptor internalTypeNamePropertyFactory(Class nodeClass) {
        return new ChildPropertyDescriptor(nodeClass, "typeName", Name.class, false); //$NON-NLS-1$
    }

    /**
     * The annotation type name; lazily initialized; defaults to an unspecified, legal Java identifier.
     */
    volatile Name typeName;

    /**
     * Creates a new AST node for an annotation node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Annotation(AST ast) {
        super(ast);
    }

    /**
     * @see IExtendedModifier#isModifier()
     */
    @Override
    public boolean isModifier() {
        return false;
    }

    /**
     * @see IExtendedModifier#isAnnotation()
     */
    @Override
    public boolean isAnnotation() {
        return true;
    }

    /**
     * Returns the annotation type name of this annotation.
     *
     * @return the annotation type name
     */
    public Name getTypeName() {
        if (this.typeName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.typeName == null) {
                    this.typeName = postLazyInit(new SimpleName(this.ast), internalTypeNameProperty());
                }
            }
        }
        return this.typeName;
    }

    /**
     * Sets the annotation type name of this annotation.
     *
     * @param typeName the annotation type name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setTypeName(Name typeName) {
        if (typeName == null) {
            throw new IllegalArgumentException();
        }
        ChildPropertyDescriptor p = internalTypeNameProperty();
        ASTNode oldChild = this.typeName;
        preReplaceChild(oldChild, typeName, p);
        this.typeName = typeName;

    }

}
