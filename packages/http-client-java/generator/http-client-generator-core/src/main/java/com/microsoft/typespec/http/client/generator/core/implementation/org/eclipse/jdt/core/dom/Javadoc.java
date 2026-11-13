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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import java.util.ArrayList;
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
@SuppressWarnings({ "rawtypes", "unchecked" })
public class Javadoc extends Comment {

    /**
     * The "comment" structural property of this node type (type: {@link String}) (JLS2 API only).
     *
     * @since 3.0
     * @deprecated Replaced by {@link #TAGS_PROPERTY} in the JLS3 API.
     */
    public static final SimplePropertyDescriptor COMMENT_PROPERTY
        = new SimplePropertyDescriptor(Javadoc.class, "comment", String.class); //$NON-NLS-1$

    /**
     * The "tags" structural property of this node type (element type: {@link TagElement}).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TAGS_PROPERTY
        = new ChildListPropertyDescriptor(Javadoc.class, "tags", TagElement.class, true); //$NON-NLS-1$

    /**
     * The "markdown" structural property of this node type (type: {@link Boolean}) (added in JLS23 API).
     *
     * @since 3.40
     * @noreference This field belongs to a preview feature and is not intended to be referenced by clients
     */
    public static final SimplePropertyDescriptor MARKDOWN_PROPERTY
        = new SimplePropertyDescriptor(Javadoc.class, "static", boolean.class); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(Javadoc.class, properyList);
        addProperty(COMMENT_PROPERTY, properyList);
        addProperty(TAGS_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(2);
        createPropertyList(Javadoc.class, properyList);
        addProperty(TAGS_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(3);
        createPropertyList(Javadoc.class, properyList);
        addProperty(TAGS_PROPERTY, properyList);
        addProperty(MARKDOWN_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The list of tag elements (element type: {@link TagElement}). Defaults to an empty list.
     *
     * @since 3.0
     */
    private final ASTNode.NodeList tags = new ASTNode.NodeList(TAGS_PROPERTY);

    private boolean isMarkdown;

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
        visitor.endVisit(this);
    }

    /**
     * Sets or clears the doc comment string. The documentation string must include the starting and ending comment
     * delimiters, and any embedded line breaks.
     *
     * @param docComment the doc comment string
     * @exception IllegalArgumentException if the Java comment string is invalid
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @deprecated The comment string was replaced in the 3.0 release by a representation of the structure of the doc
     * comment. See {@link #tags() tags}.
     */
    public void setComment(String docComment) {
        supportedOnlyIn2();
        if (docComment == null) {
            throw new IllegalArgumentException();
        }
        char[] source = docComment.toCharArray();
        Scanner scanner = this.ast.scanner;
        scanner.resetTo(0, source.length);
        scanner.setSource(source);
        try {
            TerminalToken token;
            boolean onlyOneComment = false;
            while ((token = scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameCOMMENT_JAVADOC:
                        if (onlyOneComment) {
                            throw new IllegalArgumentException();
                        }
                        onlyOneComment = true;
                        break;

                    default:
                        onlyOneComment = false;
                }
            }
            if (!onlyOneComment) {
                throw new IllegalArgumentException();
            }
        } catch (InvalidInputException e) {
            throw new IllegalArgumentException(e);
        }
        preValueChange();

    }

    /**
     * Returns the live list of tag elements that make up this doc comment. <p> The tag elements cover everything except
     * the starting and ending comment delimiters, and generally omit leading whitespace (including a leading "*") and
     * embedded line breaks. The first tag element of a typical doc comment represents all the material before the first
     * explicit doc tag; this first tag element has a <code>null</code> tag name and generally contains 1 or more
     * {@link AbstractTextElement}s, and possibly interspersed with tag elements for nested tags like "{@link String
     * String}". Subsequent tag elements represent successive top-level doc tag (e.g., "@param", "@return", "@see").
     * </p> <p> Adding and removing nodes from this list affects this node dynamically. </p>
     *
     * @return the live list of tag elements in this doc comment (element type: {@link TagElement})
     * @since 3.0
     */
    public List tags() {
        return this.tags;
    }

    /**
     * Returns whether this javadoc is a markdown comment (added in JLS23 API).
     *
     * @return <code>true</code> if this is a markdown comment, and <code>false</code> if this is a traditional javadoc
     * comment.
     * @since 3.39
     * @noreference preview feature
     */
    public boolean isMarkdown() {
        if (this.ast.apiLevel < 23) {
            throw new UnsupportedOperationException("Operation not supported in AST below JLS23"); //$NON-NLS-1$
        }
        return this.isMarkdown;
    }

    /**
     * Sets whether this javadoc is a markdown comment (added in JLS23 API).
     *
     * @param isMarkdown <code>true</code> if this is a markdown comment, and <code>false</code> if this is a
     * traditional javadoc comment.
     * @since 3.39
     * @noreference preview feature
     */
    public void setMarkdown(boolean isMarkdown) {
        if (this.ast.apiLevel < 23) {
            throw new UnsupportedOperationException("Operation not supported in AST below JLS23"); //$NON-NLS-1$
        }
        preValueChange();
        this.isMarkdown = isMarkdown;

    }
}
