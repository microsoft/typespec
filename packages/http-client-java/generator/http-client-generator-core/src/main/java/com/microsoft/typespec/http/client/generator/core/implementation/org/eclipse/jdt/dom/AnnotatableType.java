// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 * Abstract base class of AST nodes that represent an annotatable type (added in JLS8 API). <p> Introduced in JLS8, type
 * references that can be annotated are represented by AnnotatableType. For the list of types extending AnnotatableType,
 * see {@link Type}. </p> <p> Note that type annotations that semantically
 * belong to a resolved type reference don't always show up in {@link AnnotatableType#annotations()}. Syntactically,
 * type annotations can also be part of an associated declaration node's <code>modifiers()</code> list. </p>
 *
 * @since 3.10
 */
public abstract class AnnotatableType extends Type {

    /**
     * The annotations (element type: {@link Annotation}). Null in JLS < 8. Added in JLS8; defaults to an empty list
     * (see constructor).
     */
    ASTNode.NodeList<Annotation> annotations = null;

    /**
     * Creates and returns a structural property descriptor for the "annotations" property declared on the given
     * concrete node type (element type: {@link Annotation}) (added in JLS8 API).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalAnnotationsPropertyFactory() {
        return new ChildListPropertyDescriptor(Annotation.class, true);
    }

    /**
     * Returns the structural property descriptor for the "annotations" property of this node (element type:
     * {@link Annotation}) (added in JLS8 API).
     *
     * @return the property descriptor
     */
    abstract ChildListPropertyDescriptor internalAnnotationsProperty();

    /**
     * Returns the structural property descriptor for the "annotations" property of this node (element type:
     * {@link Annotation}) (added in JLS8 API).
     *
     * @return the property descriptor
     */
    public final ChildListPropertyDescriptor getAnnotationsProperty() {
        return internalAnnotationsProperty();
    }

    /**
     * Creates a new unparented node for an annotatable type owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    AnnotatableType(AST ast) {
        super(ast);
        this.annotations = new ASTNode.NodeList<>(getAnnotationsProperty());
    }

    /**
     * Returns the live ordered list of annotations for this Type node (added in JLS8 API). <p> Note that type
     * annotations that semantically belong to a resolved type reference
     * don't always show up in this list. Syntactically, type annotations can also be part of an associated declaration
     * node's <code>modifiers()</code> list. </p>
     *
     * @return the live list of annotations (element type: {@link Annotation})
     */
    public List<Annotation> annotations() {
        return this.annotations;
    }
}
