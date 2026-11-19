// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2022 IBM Corporation and others.
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
/*******************************************************************************
 * Copyright (c) 2022 IBM Corporation and others.
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
 * AST node for a tag within a doc comment. Tag elements nested within another tag element are called inline doc tags.
 *
 * <pre>
 * TagElement:
 *     [ <b>@</b> Identifier ] { DocElement }
 * DocElement:
 *     TextElement
 *     Name
 *     MethodRef
 *     MemberRef
 *     <b>{</b> TagElement <b>}</b>
 * </pre>
 *
 * @see Javadoc
 * @since 3.0
 */
public final class TagElement extends ASTNode implements IDocElement {

    /**
     * The "fragments" structural property of this node type.
     */
    public static final ChildListPropertyDescriptor FRAGMENTS_PROPERTY
        = new ChildListPropertyDescriptor(IDocElement.class, true);

    /**
     * The tag name, or null if none; defaults to null.
     */
    String optionalTagName;

    /**
     * The list of doc elements. Defaults to an empty list.
     */
    ASTNode.NodeList<ASTNode> fragments = new ASTNode.NodeList<>(FRAGMENTS_PROPERTY);

    /**
     * Creates a new AST node for a tag element owned by the given AST. The new node has no name and an empty list of
     * fragments. <p> N.B. This constructor is package-private; all subclasses must be declared in the same package;
     * clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    TagElement(AST ast) {
        super(ast);
    }

    @Override
    int getNodeType0() {
        return 65;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.fragments);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns this node's tag name, or <code>null</code> if none. For top level doc tags such as parameter tags, the
     * tag name includes the "@" character ("@param"). For inline doc tags such as link tags, the tag name includes the
     * "@" character ("@link"). The tag name may also be <code>null</code>; this is used to represent the material at
     * the start of a doc comment preceding the first explicit tag.
     *
     * @return the tag name, or <code>null</code> if none
     */
    public String getTagName() {
        return this.optionalTagName;
    }

    /**
     * Sets the tag name of this node to the given value. For top level doc tags such as parameter tags, the tag name
     * includes the "@" character ("@param"). For inline doc tags such as link tags, the tag name includes the "@"
     * character ("@link"). The tag name may also be <code>null</code>; this is used to represent the material at the
     * start of a doc comment preceding the first explicit tag.
     *
     * @param tagName the tag name, or <code>null</code> if none
     */
    public void setTagName(String tagName) {
        this.optionalTagName = tagName;
    }

    /**
     * Returns the live list of fragments in this tag element. <p> The fragments cover everything following the tag name
     * (or everything if there is no tag name), and generally omit embedded line breaks (and leading whitespace on new
     * lines, including any leading "*"). {@link TagElement} nodes are used to represent tag elements (e.g., "@link")
     * nested within this tag element. </p> <p> Here are some typical examples:
     * <ul> <li>"@see Foo#bar()" - TagElement with tag name "@see"; fragments() contains a single MethodRef node</li>
     * <li>"@param args the program arguments" - TagElement with tag name "@param"; 2 fragments: SimpleName ("args"),
     * TextElement (" the program arguments")</li> <li>"@return See {&#64;link #foo foo} instead." - TagElement with tag
     * name "@return"; 3 fragments: TextElement ("See "), TagElement (for "&#64;link #foo foo"), TextElement ("
     * instead.")</li> </ul> The use of Name, MethodRef, and MemberRef nodes within tag elements allows these fragments
     * to be queried for binding information. <p> Adding and removing nodes from this list affects this node
     * dynamically. The nodes in this list may be of various types, including {@link TextElement}, {@link TagElement},
     * {@link Name}, {@link MemberRef}, and {@link MethodRef}.
     * Clients should assume that the list of types may grow in the future, and write their code to deal with unexpected
     * nodes types. However, attempts to add a non-prescribed type of node will trigger an exception.
     *
     * @return the live list of doc elements in this tag element
     */
    public List<ASTNode> fragments() {
        return this.fragments;
    }

    /**
     * Returns whether this tag element is nested within another tag element. Nested tag elements appears enclosed in
     * "{" and "}"; certain doc tags, including "@link" and "@linkplain" are only meaningful as nested tags. Top-level
     * (i.e., non-nested) doc tags begin on a new line; certain doc tags, including "@param" and "@see" are only
     * meaningful as top-level tags. <p> This convenience methods checks to see whether the parent of this node is of
     * type {@link TagElement}. </p>
     *
     * @return <code>true</code> if this node is a nested tag element, and false if this node is either parented by a
     * doc comment node ({@link Javadoc}), or is unparented
     */
    public boolean isNested() {
        return (getParent() instanceof TagElement);
    }
}
