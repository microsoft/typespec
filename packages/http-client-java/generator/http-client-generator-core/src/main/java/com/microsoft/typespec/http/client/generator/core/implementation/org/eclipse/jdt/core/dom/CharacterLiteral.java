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

import java.util.ArrayList;
import java.util.List;

/**
 * Character literal nodes.
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class CharacterLiteral extends Expression {

    /**
     * The "escapedValue" structural property of this node type (type: {@link String}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor ESCAPED_VALUE_PROPERTY
        = new SimplePropertyDescriptor(CharacterLiteral.class, "escapedValue", String.class); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(CharacterLiteral.class, properyList);
        addProperty(ESCAPED_VALUE_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The literal string, including quotes and escapes; defaults to the literal for the character 'X'.
     */
    private String escapedValue = "'X'";//$NON-NLS-1$

    /**
     * Creates a new unparented character literal node owned by the given AST. By default, the character literal denotes
     * an unspecified character. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    CharacterLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 13;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the string value of this literal node. The value is the sequence of characters that would appear in the
     * source program, including enclosing single quotes and embedded escapes.
     *
     * @return the escaped string value, including enclosing single quotes and embedded escapes
     */
    public String getEscapedValue() {
        return this.escapedValue;
    }

    /*
     * (omit javadoc for this method) This method is a copy of setEscapedValue(String) that doesn't do any validation.
     */
    void internalSetEscapedValue(String value) {
        preValueChange();
        this.escapedValue = value;

    }
}
