// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Provides directive AST node type (added in JLS9 API).
 *
 * <pre>
 * ProvidesDirective:
 *     <b>provides</b> Name <b>with</b> Name {<b>,</b> Name } <b>;</b>
 * </pre>
 *
 * @since 3.14
 *
 * @noextend This class is not intended to be subclassed by clients.
 */
public class ProvidesDirective extends ModuleDirective {

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The "implementations" structural property of this node type (element type: {@link Name}).
     */
    public static final ChildListPropertyDescriptor IMPLEMENTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(Name.class, false);

    /**
     * The interface name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name name;

    /**
     * The implementations names (element type: {@link Name}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Name> implementations = new ASTNode.NodeList<>(IMPLEMENTATIONS_PROPERTY);

    /**
     * Creates a new AST node for an provides directive owned by the given AST. The provides directive initially is for
     * an unspecified, but legal, Java type name. <p> N.B. This constructor is package-private; all subclasses must be
     * declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ProvidesDirective(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 98;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.implementations);
        }
    }

    /**
     * Returns the name of the service in this directive.
     *
     * @return the services name
     */
    public Name getName() {
        if (this.name == null) {
            this.name = postLazyInit(this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)),
                NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the name of the service.
     *
     * @param name the new service name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }

    /**
     * Returns the live ordered list of implementations for the interface in this provides directive.
     *
     * @return the live list of implementations for the interface (element type: {@link Name})
     */
    public List<Name> implementations() {
        return this.implementations;
    }
}
