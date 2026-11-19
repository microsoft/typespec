// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2019 IBM Corporation and others.
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

import java.util.List;

/**
 * Normal annotation node (added in JLS3 API).
 *
 * <pre>
 * NormalAnnotation:
 *   <b>@</b> TypeName <b>(</b> [ MemberValuePair { <b>,</b> MemberValuePair } ] <b>)</b>
 * </pre>
 *
 * @since 3.1
 */
public final class NormalAnnotation extends Annotation {

    /**
     * The "typeName" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor TYPE_NAME_PROPERTY = internalTypeNamePropertyFactory();

    /**
     * The "values" structural property of this node type (element type: {@link MemberValuePair}).
     */
    public static final ChildListPropertyDescriptor VALUES_PROPERTY
        = new ChildListPropertyDescriptor(MemberValuePair.class, true);

    /**
     * The list of member value pairs (element type: {@link MemberValuePair}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<MemberValuePair> values = new ASTNode.NodeList<>(VALUES_PROPERTY);

    /**
     * Creates a new unparented normal annotation node owned by the given AST. By default, the annotation has an
     * unspecified type name and an empty list of member value pairs. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    NormalAnnotation(AST ast) {
        super(ast);

    }

    @Override
    ChildPropertyDescriptor internalTypeNameProperty() {
        return TYPE_NAME_PROPERTY;
    }

    @Override
    int getNodeType0() {
        return 77;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getTypeName());
            acceptChildren(visitor, this.values);
        }

    }

    /**
     * Returns the live list of member value pairs in this annotation. Adding and removing nodes from this list affects
     * this node dynamically. All nodes in this list must be {@link MemberValuePair}s; attempts to add any other type of
     * node will trigger an exception.
     *
     * @return the live list of member value pairs in this annotation (element type: {@link MemberValuePair})
     */
    public List<MemberValuePair> values() {
        return this.values;
    }
}
