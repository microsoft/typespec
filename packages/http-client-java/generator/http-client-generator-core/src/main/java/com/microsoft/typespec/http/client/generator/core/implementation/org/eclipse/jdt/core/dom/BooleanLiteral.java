// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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
 * Boolean literal node.
 *
 * <pre>
 * BooleanLiteral:
 * 		<b>true</b>
 * 		<b>false</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class BooleanLiteral extends Expression {

    /**
     * The "booleanValue" structural property of this node type (type: {@link Boolean}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor BOOLEAN_VALUE_PROPERTY
        = new SimplePropertyDescriptor(BooleanLiteral.class, "booleanValue", boolean.class); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(BooleanLiteral.class, properyList);
        addProperty(BOOLEAN_VALUE_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The boolean; defaults to the literal for <code>false</code>.
     */
    private boolean value = false;

    /**
     * Creates a new unparented boolean literal node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    BooleanLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 9;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the boolean value of this boolean literal node.
     *
     * @return <code>true</code> for the boolean literal spelled <code>"true"</code>, and <code>false</code> for the
     * boolean literal spelled <code>"false"</code>.
     */
    public boolean booleanValue() {
        return this.value;
    }

    /**
     * Sets the boolean value of this boolean literal node.
     *
     * @param value <code>true</code> for the boolean literal spelled <code>"true"</code>, and <code>false</code> for
     * the boolean literal spelled <code>"false"</code>.
     */
    public void setBooleanValue(boolean value) {
        preValueChange();
        this.value = value;

    }
}
