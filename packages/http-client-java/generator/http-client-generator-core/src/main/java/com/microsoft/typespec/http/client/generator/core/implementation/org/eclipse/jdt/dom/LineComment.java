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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * End-of-line comment AST node type. <p> End-of-line comments begin with "//", must end with a line delimiter (as per
 * JLS 3.7), and must not contain line breaks. </p> <p> Note that this node type is a comment placeholder, and is only
 * useful for recording the source range where a comment was found in a source string. It is not useful for creating
 * comments. </p>
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public final class LineComment extends Comment {

    /**
     * Creates a new line comment node owned by the given AST. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    LineComment(AST ast) {
        super(ast);
    }

    @Override
    int getNodeType0() {
        return 63;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }
}
