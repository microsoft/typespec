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
 * Abstract base class for all AST nodes that represent comments. There are exactly three kinds of comment: line
 * comments ({@link LineComment}), block comments ({@link BlockComment}), and doc comments ({@link Javadoc}).
 *
 * <pre>
 * Comment:
 *     LineComment
 *     BlockComment
 *     Javadoc
 * </pre>
 *
 * @since 3.0
 */
public abstract class Comment extends ASTNode {

    /**
     * Creates a new AST node for a comment owned by the given AST. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Comment(AST ast) {
        super(ast);
    }

    /**
     * Returns whether this comment is a doc comment (<code>Javadoc</code>).
     *
     * @return <code>true</code> if this is a doc comment, and <code>false</code> otherwise
     */
    public final boolean isDocComment() {
        return (this instanceof Javadoc);
    }

    /**
     * Returns the root AST node that this comment occurs within, or <code>null</code> if none (or not recorded).
     */
    public final void setAlternateRoot() {
        // alternate root is *not* considered a structural property
        // but we protect them nevertheless
        checkModifiable();
    }
}
