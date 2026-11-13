// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CharConstant;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.ScannerHelper;

public class CharLiteral extends NumberLiteral {

    char value;

    public CharLiteral(char[] token, int s, int e) {
        super(token, s, e);
        computeValue();
    }

    private void computeValue() {
        // The source is a char[3] first and last char are '
        // This is true for both regular char AND unicode char
        // BUT not for escape char like '\b' which are char[4]....
        if ((this.value = this.source[1]) != '\\')
            return;
        char digit;
        switch (digit = this.source[2]) {
            case 's':
                this.value = ' ';
                break;

            case 'b':
                this.value = '\b';
                break;

            case 't':
                this.value = '\t';
                break;

            case 'n':
                this.value = '\n';
                break;

            case 'f':
                this.value = '\f';
                break;

            case 'r':
                this.value = '\r';
                break;

            case '\"':
                this.value = '\"';
                break;

            case '\'':
                this.value = '\'';
                break;

            case '\\':
                this.value = '\\';
                break;

            default: // octal (well-formed: ended by a ' )
                int number = ScannerHelper.getNumericValue(digit);
                if ((digit = this.source[3]) != '\'')
                    number = (number * 8) + ScannerHelper.getNumericValue(digit);
                else {
                    this.constant = CharConstant.fromValue(this.value = (char) number);
                    break;
                }
                if ((digit = this.source[4]) != '\'')
                    number = (number * 8) + ScannerHelper.getNumericValue(digit);
                this.value = (char) number;
                break;
        }
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        java.util.Objects.requireNonNull(visitor);
    }
}
