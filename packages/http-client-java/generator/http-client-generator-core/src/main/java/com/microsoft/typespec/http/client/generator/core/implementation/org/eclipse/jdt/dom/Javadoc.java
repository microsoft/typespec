// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2022 IBM Corporation and others.
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
 * AST node for a Javadoc-style doc comment.
 *
 * <pre>
 * Javadoc:
 *   <b>/** </b> { TagElement } <b>*</b><b>/</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class Javadoc extends Comment {

    /**
     * The "tags" structural property of this node type (element type: {@link TagElement}).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TAGS_PROPERTY
        = new ChildListPropertyDescriptor(TagElement.class, true);

    /**
     * The list of tag elements (element type: {@link TagElement}). Defaults to an empty list.
     *
     * @since 3.0
     */
    private final ASTNode.NodeList tags = new ASTNode.NodeList(TAGS_PROPERTY);

    /**
     * Creates a new AST node for a doc comment owned by the given AST. The new node has an empty list of tag elements
     * (and, for backwards compatability, an unspecified, but legal, doc comment string). <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    Javadoc(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 29;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.tags);
        }
        visitor.endVisitJavadoc();
    }

    /**
     * Returns the live list of tag elements that make up this doc comment. <p> The tag elements cover everything except
     * the starting and ending comment delimiters, and generally omit leading whitespace (including a leading "*") and
     * embedded line breaks. The first tag element of a typical doc comment represents all the material before the first
     * explicit doc tag; this first tag element has a <code>null</code> tag name and generally contains 1 or more
     * {@link TextElement}s, and possibly interspersed with tag elements for nested tags like "{@link String
     * String}". Subsequent tag elements represent successive top-level doc tag (e.g., "@param", "@return", "@see").
     * </p> <p> Adding and removing nodes from this list affects this node dynamically. </p>
     *
     * @return the live list of tag elements in this doc comment (element type: {@link TagElement})
     * @since 3.0
     */
    public List tags() {
        return this.tags;
    }

}
