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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import java.util.ArrayList;
import java.util.List;

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
     * The "identifier" structural property of this node type (type: {@link String}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor IDENTIFIER_PROPERTY
        = new SimplePropertyDescriptor(SimpleName.class, "identifier", String.class); //$NON-NLS-1$

    /**
     * The "var" property of this node name (type: {@link Boolean}) (added in JLS10 API).
     *
     * @since 3.14
     */
    public static final SimplePropertyDescriptor VAR_PROPERTY
        = new SimplePropertyDescriptor(SimpleName.class, "var", boolean.class); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(SimpleName.class, propertyList);
        addProperty(IDENTIFIER_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(3);
        createPropertyList(SimpleName.class, propertyList);
        addProperty(IDENTIFIER_PROPERTY, propertyList);
        addProperty(VAR_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

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
        visitor.endVisit(this);
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
        if (identifier == null) {
            throw new IllegalArgumentException();
        }
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
        unsupportedBelow10();
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
