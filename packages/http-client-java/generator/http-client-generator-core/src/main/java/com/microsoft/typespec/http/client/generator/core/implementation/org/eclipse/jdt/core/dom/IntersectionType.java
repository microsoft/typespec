// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2019 IBM Corporation and others.
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
 * Type node for an intersection type in a cast expression (added in JLS8 API).
 *
 * <pre>
 * IntersectionType:
 *    Type <b>&amp;</b> Type { <b>&amp;</b> Type }
 * </pre>
 *
 * <p> This kind of node is used only inside a cast expression. </p>
 *
 * @since 3.10
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class IntersectionType extends Type {

    /**
     * The "types" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPES_PROPERTY
        = new ChildListPropertyDescriptor(IntersectionType.class, "types", Type.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(IntersectionType.class, propertyList);
        addProperty(TYPES_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The list of types (element type: {@link Type}). Defaults to an empty list.
     */
    private final ASTNode.NodeList types = new ASTNode.NodeList(TYPES_PROPERTY);

    /**
     * Creates a new unparented node for an intersection type owned by the given AST. By default, it has no types.<p>
     *
     * N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    IntersectionType(AST ast) {
        super(ast);
        unsupportedIn2_3_4();
    }

    @Override
    final int getNodeType0() {
        return 87;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.types);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of types in this intersection type. Adding and removing nodes from this list
     * affects this node dynamically. All nodes in this list must be <code>Type</code>s; attempts to add any other type
     * of node will trigger an exception.
     *
     * @return the live list of types in this intersection type (element type: {@link Type})
     */
    public List types() {
        return this.types;
    }
}
