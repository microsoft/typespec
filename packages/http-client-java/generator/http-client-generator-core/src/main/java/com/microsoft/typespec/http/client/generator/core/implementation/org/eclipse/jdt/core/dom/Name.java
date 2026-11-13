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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

/**
 * Abstract base class for all AST nodes that represent names. There are exactly two kinds of name: simple ones
 * (<code>SimpleName</code>) and qualified ones (<code>QualifiedName</code>).
 *
 * <pre>
 * Name:
 *     SimpleName
 *     QualifiedName
 * </pre>
 *
 * @since 2.0
 * @noextend This class is not intended to be subclassed by clients.
 */
public abstract class Name extends Expression implements IDocElement {

    /**
     * This index represents the position inside a qualified name.
     */
    int index;

    /**
     * Creates a new AST node for a name owned by the given AST. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Name(AST ast) {
        super(ast);
    }

    /**
     * Returns whether this name is a simple name (<code>SimpleName</code>).
     *
     * @return <code>true</code> if this is a simple name, and <code>false</code> otherwise
     */
    public final boolean isSimpleName() {
        return (this instanceof SimpleName);
    }

    /**
     * Returns the standard dot-separated representation of this name. If the name is a simple name, the result is the
     * name's identifier. If the name is a qualified name, the result is the name of the qualifier (as computed by this
     * method) followed by "." followed by the name's identifier.
     *
     * @return the fully qualified name
     * @since 3.0
     */
    public final String getFullyQualifiedName() {
        if (isSimpleName()) {
            // avoid creating garbage for common case
            return ((SimpleName) this).getIdentifier();
        } else {
            StringBuilder buffer = new StringBuilder(50);
            appendName(buffer);
            return new String(buffer);
        }
    }

    /**
     * Appends the standard representation of this name to the given string buffer.
     *
     * @param buffer the buffer
     * @since 3.0
     */
    abstract void appendName(StringBuilder buffer);
}
