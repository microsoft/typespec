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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;

/**
 * String literal nodes.
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class StringLiteral extends Expression {

    /**
     * Creates a new unparented string literal node owned by the given AST. By default, the string literal denotes the
     * empty string. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    StringLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 45;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }

    /**
     * Sets the string value of this literal node to the given string literal token. The token is the sequence of
     * characters that would appear in the source program, including enclosing double quotes and embedded escapes. For
     * example, <ul> <li><code>""</code> <code>setLiteral("\"\"")</code></li> <li><code>"hello world"</code>
     * <code>setLiteral("\"hello world\"")</code></li> <li><code>"boo\nhoo"</code>
     * <code>setLiteral("\"boo\\nhoo\"")</code></li> </ul>
     *
     * @param token the string literal token, including enclosing double quotes and embedded escapes
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setEscapedValue(String token) {
        // update internalSetEscapedValue(String) if this is changed

        Scanner scanner = this.ast.scanner;
        char[] source = token.toCharArray();
        scanner.setSource(source);
        scanner.resetTo(0, source.length);
        try {
            TerminalToken tokenType = scanner.getNextToken();
            if (tokenType != TerminalToken.TokenNameStringLiteral) {
                throw new IllegalArgumentException("Invalid string literal : >" + token + "<"); //$NON-NLS-1$//$NON-NLS-2$
            }
        } catch (InvalidInputException e) {
            throw new IllegalArgumentException("Invalid string literal : >" + token + "<");//$NON-NLS-1$//$NON-NLS-2$
        }
        preValueChange();

    }

    /*
     * (omit javadoc for this method) This method is a copy of setEscapedValue(String) that doesn't do any validation.
     */
    void internalSetEscapedValue() {
        preValueChange();
    }

    /**
     * Sets the value of this literal node. <p> For example,
     *
     * <pre>
     * StringLiteral s;
     * s.setLiteralValue("hello\nworld");
     * assert s.getEscapedValue().equals("\"hello\\nworld\"");
     * assert s.getLiteralValue().equals("hello\nworld");
     * </pre>
     *
     * <p> Note that this is a convenience method that converts to the stored string literal token acceptable to
     * <code>setEscapedLiteral</code>. </p>
     *
     * @param value the string value without enclosing double quotes and embedded escapes
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setLiteralValue(String value) {

        int len = value.length();
        StringBuilder b = new StringBuilder(len + 2);

        b.append("\""); // opening delimiter //$NON-NLS-1$
        for (int i = 0; i < len; i++) {
            char c = value.charAt(i);
            Util.appendEscapedChar(b, c);
        }
        b.append("\""); // closing delimiter //$NON-NLS-1$
        setEscapedValue(b.toString());
    }
}
