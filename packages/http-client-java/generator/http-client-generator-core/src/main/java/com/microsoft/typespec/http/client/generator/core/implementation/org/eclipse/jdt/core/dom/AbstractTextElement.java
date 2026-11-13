// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

/**
 * AST node for a text element within a doc comment.
 *
 * <pre>
 * AbstractTextElement:
 *     Sequence of characters not including a close comment delimiter <b>*</b><b>/</b>
 * </pre>
 *
 * @see TextElement
 * @see JavaDocTextElement
 * @since 3.31
 */
@SuppressWarnings("rawtypes")
public abstract class AbstractTextElement extends ASTNode implements IDocElement {

    /**
     * The "text" structural property of this node type (type: {@link String}).
     */
    public static SimplePropertyDescriptor internalTextPropertyFactory(Class nodeClass) {
        return new SimplePropertyDescriptor(nodeClass, "text", String.class); //$NON-NLS-1$
    }

    /**
     * The text element; defaults to the empty string.
     */
    String text = Util.EMPTY_STRING;

    /**
     * Creates a new AST node for a text element owned by the given AST. <p> N.B. This constructor is package-private;
     * all subclasses must be declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    AbstractTextElement(AST ast) {
        super(ast);
    }

    /**
     * Returns this node's tag name, or <code>null</code> if none. For top level doc tags such as parameter tags, the
     * tag name includes the "@" character ("@param"). For inline doc tags such as link tags, the tag name includes the
     * "@" character ("@link"). The tag name may also be <code>null</code>; this is used to represent the material at
     * the start of a doc comment preceding the first explicit tag.
     *
     * @return the tag name, or <code>null</code> if none
     */
    public String getText() {
        return this.text;
    }

    /**
     * Sets the text of this node to the given value. <p> The text element typically includes leading and trailing
     * whitespace that separates it from the immediately preceding or following elements. </p>
     *
     * @param text the text of this node
     * @exception IllegalArgumentException if the text is null
     */
    public void setText(String text) {
        if (text == null) {
            throw new IllegalArgumentException();
        }
    }
}
