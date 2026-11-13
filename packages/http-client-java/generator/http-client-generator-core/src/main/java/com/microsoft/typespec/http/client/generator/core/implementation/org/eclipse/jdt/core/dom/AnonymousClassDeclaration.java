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
 * Anonymous class declaration AST node type. For JLS2, this type of node appears only as a child on a class instance
 * creation expression. For JLS3, this type of node appears may also appear as the child of an enum constant
 * declaration.
 *
 * <pre>
 * AnonymousClassDeclaration:
 *        <b>{</b> ClassBodyDeclaration <b>}</b>
 * </pre>
 *
 * @see ClassInstanceCreation
 * @see EnumConstantDeclaration
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class AnonymousClassDeclaration extends ASTNode {

    /**
     * The "bodyDeclarations" structural property of this node type (element type: {@link BodyDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY = new ChildListPropertyDescriptor(
        AnonymousClassDeclaration.class, "bodyDeclarations", BodyDeclaration.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(AnonymousClassDeclaration.class, properyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The body declarations (element type: {@link BodyDeclaration}). Defaults to none.
     */
    private final ASTNode.NodeList bodyDeclarations = new ASTNode.NodeList(BODY_DECLARATIONS_PROPERTY);

    /**
     * Creates a new AST node for an anonymous class declaration owned by the given AST. By default, the list of body
     * declarations is empty. <p> N.B. This constructor is package-private; all subclasses must be declared in the same
     * package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    AnonymousClassDeclaration(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 1;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.bodyDeclarations);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live ordered list of body declarations of this anonymous class declaration.
     *
     * @return the live list of body declarations (element type: {@link BodyDeclaration})
     */
    public List bodyDeclarations() {
        return this.bodyDeclarations;
    }

}
