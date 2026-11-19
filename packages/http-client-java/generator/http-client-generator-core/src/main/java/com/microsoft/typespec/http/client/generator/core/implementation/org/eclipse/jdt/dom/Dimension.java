// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2023 IBM Corporation and others.
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
 * AST node for an array dimension (added in JLS8 API). <p> A dimension, represented as <b>[]</b>, can have type
 * annotations. The dimension node is used for: </p> <ul> <li>the dimensions of an {@link ArrayType}</li> <li>extra
 * dimension in the following node types: {@link SingleVariableDeclaration}, {@link VariableDeclarationFragment},
 * {@link MethodDeclaration}</li> </ul>
 *
 * <pre>
 * Dimension:
 * 	{ Annotation } <b>[]</b>
 * </pre>
 *
 * @since 3.10
 */
public class Dimension extends ASTNode {

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(Annotation.class, false);

    /**
     * The list of annotations for this dimension (element type: {@link Annotation}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Annotation> annotations = new ASTNode.NodeList<>(ANNOTATIONS_PROPERTY);

    /**
     * Creates a new dimension node (supported only in level JLS8 or above). <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Dimension(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 85;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.annotations);
        }

    }

    /**
     * Returns the live ordered list of annotations for this dimension.
     *
     * @return the live list of annotations (element type: {@link Annotation})
     */
    public List<Annotation> annotations() {
        return this.annotations;
    }
}
