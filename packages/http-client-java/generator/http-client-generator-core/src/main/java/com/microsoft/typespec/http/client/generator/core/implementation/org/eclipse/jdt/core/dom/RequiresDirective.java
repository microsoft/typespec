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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @noextend This class is not intended to be subclassed by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class RequiresDirective extends ModuleDirective {

    /**
     * The "modifiers" structural property of this node type (element type: {@link ModuleModifier}).
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(RequiresDirective.class, "modifiers", ModuleModifier.class, false); //$NON-NLS-1$

    /**
     * The module structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(RequiresDirective.class, "name", Name.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(RequiresDirective.class, propertyList);
        addProperty(MODIFIERS_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The extended modifiers (element type: {@link ModuleModifier}). defaults to an empty list
     */
    private final ASTNode.NodeList modifiers = new ASTNode.NodeList(MODIFIERS_PROPERTY);

    /**
     * The referenced module name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile Name name;

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
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getName());
        }
    }

    /**
     * Returns the live ordered list of modifiers of this declaration. <p> Note that the not all modifiers are legal.
     * </p>
     *
     * @return the live list of module modifiers (element type: {@link ModuleModifier})
     */
    public List modifiers() {
        return this.modifiers;
    }

    /**
     * Returns the module name referenced by this declaration.
     *
     * @return the module referenced
     */
    public Name getName() {
        if (this.name == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.name == null) {
                    this.name = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
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
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }
}
