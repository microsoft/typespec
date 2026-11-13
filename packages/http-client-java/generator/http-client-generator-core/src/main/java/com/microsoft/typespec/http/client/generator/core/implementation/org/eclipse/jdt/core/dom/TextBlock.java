// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2019, 2021 IBM Corporation and others.
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
 * TextBlock AST node type.
 *
 * These are block of String literal nodes.
 *
 * @since 3.22
 */
@SuppressWarnings("rawtypes")
public class TextBlock extends Expression {

    /**
     * The "escapedValue" structural property of this node type (type: {@link String}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor ESCAPED_VALUE_PROPERTY
        = new SimplePropertyDescriptor(TextBlock.class, "escapedValue", String.class); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(TextBlock.class, propertyList);
        addProperty(ESCAPED_VALUE_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The literal string, including quotes and escapes; defaults to the literal for the empty string.
     */
    private String escapedValue = "\"\"";//$NON-NLS-1$

    /**
     * Creates a new unparented TextBlock node owned by the given AST. By default, the TextBlock denotes the empty
     * string. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     * @exception UnsupportedOperationException if this operation is used beloe JLS15
     */
    TextBlock(AST ast) {
        super(ast);
        unsupportedBelow15();
    }

    @Override
    final int getNodeType0() {
        return 102;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the string value of this literal node to the given string literal token. The token is the sequence of
     * characters that would appear in the source program, including enclosing double quotes and embedded escapes.
     *
     * @return the string literal token, including enclosing double quotes and embedded escapes
     * @since 3.24
     */
    public String getEscapedValue() {
        return this.escapedValue;
    }

    /*
     * (omit javadoc for this method) This method is does what setEscapedValue(String) does but without any validation.
     * In addition, it also sets the literalValue property.
     */
    void internalSetEscapedValue(String token, String literal) {
        preValueChange();
        this.escapedValue = token;

    }
}
