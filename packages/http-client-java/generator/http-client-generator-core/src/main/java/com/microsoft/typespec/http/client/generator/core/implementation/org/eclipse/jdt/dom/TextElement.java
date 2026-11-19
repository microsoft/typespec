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

/**
 * AST node for a text element within a doc comment.
 *
 * <pre>
 * TextElement:
 *     Sequence of characters not including a close comment delimiter <b>*</b><b>/</b>
 * </pre>
 *
 * @see Javadoc
 * @since 3.0
 */
public final class TextElement extends ASTNode implements IDocElement {

    /**
     * Creates a new AST node for a text element owned by the given AST. The new node has an empty text string. <p> N.B.
     * This constructor is package-private; all subclasses must be declared in the same package; clients are unable to
     * declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    TextElement(AST ast) {
        super(ast);
    }

    @Override
    int getNodeType0() {
        return 66;
    }

    @Override
    void accept0(ASTVisitor visitor) {
    }

    /**
     * Sets the text of this node to the given value. <p> The text element typically includes leading and trailing
     * whitespace that separates it from the immediately preceding or following elements. The text element must not
     * include a block comment closing delimiter "*"+"/". </p>
     *
     * @param text the text of this node
     * @exception IllegalArgumentException if the text is null or contains a block comment closing delimiter
     */
    public void setText(String text) {
        if (text.indexOf("*/") > 0) { //$NON-NLS-1$
            throw new IllegalArgumentException();
        }

    }
}
