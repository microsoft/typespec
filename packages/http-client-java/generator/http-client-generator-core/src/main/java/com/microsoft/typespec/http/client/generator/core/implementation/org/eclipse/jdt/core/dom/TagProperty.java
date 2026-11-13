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
 * TagProperty pattern AST node type.
 *
 * <pre>
 * TagProperty:
 *      Name
 *      String Value
 *      Node Value
 * </pre>
 *
 * @since 3.30
 */
@SuppressWarnings("rawtypes")
public class TagProperty extends ASTNode implements IDocElement {

    TagProperty(AST ast) {
        super(ast);
        unsupportedBelow18();
    }

    /**
     * The "name" structural property of this node type (added in JEP 413).
     */
    public static final SimplePropertyDescriptor NAME_PROPERTY
        = new SimplePropertyDescriptor(TagProperty.class, "name", String.class); //$NON-NLS-1$ );

    /**
     * The "string_value" structural property of this node type . (added in JEP 413).
     */
    public static final SimplePropertyDescriptor STRING_VALUE_PROPERTY
        = new SimplePropertyDescriptor(TagProperty.class, "string_value", String.class); //$NON-NLS-1$ );

    /**
     * The "node_value" structural property of this node type . (added in JEP 413).
     */
    public static final ChildPropertyDescriptor NODE_VALUE_PROPERTY
        = new ChildPropertyDescriptor(TagProperty.class, "node_value", ASTNode.class, true); //$NON-NLS-1$ );

    static {
        List propertyList = new ArrayList(4);
        createPropertyList(TagProperty.class, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(STRING_VALUE_PROPERTY, propertyList);
        addProperty(NODE_VALUE_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The property name
     */
    private String name = null;

    /**
     * The property string value
     */
    private String string_value = null;

    /**
     * The property node value
     */
    private ASTNode node_value = null;

    @Override
    int getNodeType0() {
        return 110;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the name of this tag property.
     *
     * @return the name
     * @exception UnsupportedOperationException if this operation is used below than JLS18
     */
    public String getName() {
        unsupportedBelow18();
        return this.name;
    }

    /**
     * Returns the string value of this tag property.
     *
     * @return the string_value
     * @exception UnsupportedOperationException if this operation is used below than JLS18
     */
    public String getStringValue() {
        unsupportedBelow18();
        return this.string_value;
    }

    /**
     * Returns the node value of this tag property.
     *
     * @return the node_value
     * @exception UnsupportedOperationException if this operation is used below than JLS18
     */
    public ASTNode getNodeValue() {
        unsupportedBelow18();
        return this.node_value;
    }

    /**
     * Sets the name of this tag property.
     *
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public void setName(String name) {
        unsupportedBelow18();
        preValueChange();
        this.name = name;

    }

    /**
     * Sets the string value of this tag property.
     *
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public void setStringValue(String value) {
        unsupportedBelow18();
        preValueChange();
        this.string_value = value;

    }

    /**
     * Sets the node value of this tag property.
     *
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public void setNodeValue(ASTNode value) {
        unsupportedBelow18();
        ASTNode oldChild = this.node_value;
        preReplaceChild(oldChild, value, NODE_VALUE_PROPERTY);
        this.node_value = value;

    }
}
