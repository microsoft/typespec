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

import java.util.ArrayList;
import java.util.List;

/**
 * AST node for a text element within a doc comment.
 *
 * <pre>
 * TextElement:
 *     Sequence of characters including a close comment delimiter <b>*</b><b>/</b>
 * </pre>
 *
 * @see Javadoc
 * @since 3.31
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public final class JavaDocTextElement extends AbstractTextElement {

    /**
     * The "text" structural property of this node type (type: {@link String}).
     */
    public static final SimplePropertyDescriptor TEXT_PROPERTY = internalTextPropertyFactory(JavaDocTextElement.class);

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(JavaDocTextElement.class, propertyList);
        addProperty(TEXT_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * Creates a new AST node for a text element owned by the given AST. The new node has an empty text string. <p> N.B.
     * This constructor is package-private; all subclasses must be declared in the same package; clients are unable to
     * declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    JavaDocTextElement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 112;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Sets the text of this node to the given value. <p> The text element typically includes leading and trailing
     * whitespace that separates it from the immediately preceding or following elements. </p>
     *
     * @param text the text of this node
     * @exception IllegalArgumentException if the text is null or contains a block comment closing delimiter
     */
    @Override
    public void setText(String text) {
        super.setText(text);
        preValueChange();
        this.text = text;

    }
}
