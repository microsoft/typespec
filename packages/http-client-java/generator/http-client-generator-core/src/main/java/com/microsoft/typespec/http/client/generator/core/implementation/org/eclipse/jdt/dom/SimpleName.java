// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2018 IBM Corporation and others.
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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;

/**
 * AST node for a simple name. A simple name is an identifier other than a keyword, boolean literal ("true", "false") or
 * null literal ("null").
 *
 * <pre>
 * SimpleName:
 *     Identifier
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class SimpleName extends Name {

    /**
     * The identifier; defaults to a unspecified, legal Java identifier.
     */
    private String identifier = "MISSING";

    /**
     * Creates a new AST node for a simple name owned by the given AST. The new node has an unspecified, legal Java
     * identifier. <p> N.B. This constructor is package-private; all subclasses must be declared in the same package;
     * clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    SimpleName(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 42;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }

    /**
     * Returns this node's identifier.
     *
     * @return the identifier of this node
     */
    public String getIdentifier() {
        return this.identifier;
    }

    /**
     * Sets the identifier of this node to the given value. The identifier should be legal according to the rules of the
     * Java language. Note that keywords are not legal identifiers. <p> Note that the list of keywords may depend on the
     * version of the language (determined when the AST object was created). </p>
     *
     * @param identifier the identifier of this node
     * @exception IllegalArgumentException if the identifier is invalid
     */
    public void setIdentifier(String identifier) {
        // update internalSetIdentifier if this is changed

        Scanner scanner = this.ast.scanner;
        long sourceLevel = scanner.sourceLevel;
        long complianceLevel = scanner.complianceLevel;

        try {
            scanner.sourceLevel = 3407872L;
            scanner.complianceLevel = 3407872L;
            char[] source = identifier.toCharArray();
            scanner.setSource(source);
            final int length = source.length;
            scanner.resetTo(0, length - 1);
            try {
                TerminalToken tokenType = scanner.scanIdentifier();
                if (tokenType != TerminalToken.TokenNameIdentifier) {
                    throw new IllegalArgumentException("Invalid identifier : >" + identifier + "<");  //$NON-NLS-1$//$NON-NLS-2$
                }
                if (scanner.currentPosition != length) {
                    // this is the case when there is only one identifier see 87849
                    throw new IllegalArgumentException("Invalid identifier : >" + identifier + "<");  //$NON-NLS-1$//$NON-NLS-2$
                }
            } catch (InvalidInputException e) {
                throw new IllegalArgumentException("Invalid identifier : >" + identifier + "<", e); //$NON-NLS-1$//$NON-NLS-2$
            }
        } finally {
            this.ast.scanner.sourceLevel = sourceLevel;
            this.ast.scanner.complianceLevel = complianceLevel;
        }
        preValueChange();
        this.identifier = identifier;

    }

    /* package */ void setVar() {

        preValueChange();

    }

    /*
     * (omit javadoc for this method) This method is a copy of setIdentifier(String) that doesn't do any validation.
     */
    void internalSetIdentifier(String ident) {
        preValueChange();
        this.identifier = ident;

    }

    @Override
    void appendName(StringBuilder buffer) {
        buffer.append(getIdentifier());
    }
}
