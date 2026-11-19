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
 * Requires directive AST node type (added in JLS9 API).
 *
 * <pre>
 * RequiresDirective:
 *     <b>requires</b> { ModuleModifier } Name <b>;</b>
 * </pre>
 *
 * @since 3.14
 * @noextend This class is not intended to be subclassed by clients.
 */
public class RequiresDirective extends ModuleDirective {

    /**
     * The "modifiers" structural property of this node type (element type: {@link ModuleModifier}).
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(ModuleModifier.class, false);

    /**
     * The module structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The extended modifiers (element type: {@link ModuleModifier}). defaults to an empty list
     */
    private final ASTNode.NodeList<ModuleModifier> modifiers = new ASTNode.NodeList<>(MODIFIERS_PROPERTY);

    /**
     * The referenced module name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name name;

    /**
     * Creates a new AST node for an requires directive owned by the given AST. The requires directive initially is a
     * regular (no modifiers) requires for an unspecified, but legal, Java module name. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    RequiresDirective(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 94;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        acceptChildren(visitor, this.modifiers);
        acceptChild(visitor, getName());
    }

    /**
     * Returns the live ordered list of modifiers of this declaration. <p> Note that the not all modifiers are legal.
     * </p>
     *
     * @return the live list of module modifiers (element type: {@link ModuleModifier})
     */
    public List<ModuleModifier> modifiers() {
        return this.modifiers;
    }

    /**
     * Returns the module name referenced by this declaration.
     *
     * @return the module referenced
     */
    public Name getName() {
        if (this.name == null) {
            this.name = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the module name in requires directive to the given name.
     *
     * @param name the new module name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>the node is null</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }
}
