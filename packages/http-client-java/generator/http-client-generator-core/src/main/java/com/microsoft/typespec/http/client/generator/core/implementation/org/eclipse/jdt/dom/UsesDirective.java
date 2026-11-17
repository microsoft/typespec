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

/**
 * Uses directive AST node type (added in JLS9 API).
 *
 * <pre>
 * UsesDirective:
 *     <b>uses</b> Name <b>;</b>
 * </pre>
 *
 * @since 3.14
 *
 * @noextend This class is not intended to be subclassed by clients.
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class UsesDirective extends ModuleDirective {

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The module name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name name;

    /**
     * Creates a new AST node for an uses directive owned by the given AST. The uses directive initially is for an
     * unspecified, but legal, Java type name. <p> N.B. This constructor is package-private; all subclasses must be
     * declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    UsesDirective(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 97;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        acceptChild(visitor, getName());
    }

    /**
     * Returns the name of the service in this directive.
     *
     * @return the name of the service
     */
    public Name getName() {
        if (this.name == null) {
            this.name = postLazyInit(this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)),
                NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the name of the service in this directive.
     *
     * @param name the new name of the service
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }
}
