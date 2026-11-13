// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2020 IBM Corporation and others.
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
 * AST node for a module qualified name. A module qualified name is defined as a qualified/simple name preceded by a
 * module name, which qualifies it. Expressing it this way means that the module qualifier and the qualified name get
 * their own AST nodes.
 *
 * <pre>
 * ModuleQualifiedName:
 *    Name <b>.</b> Name
 * </pre>
 *
 *
 *
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @since 3.24
 */
@SuppressWarnings("rawtypes")
public class ModuleQualifiedName extends Name {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}). *
     */
    public static final ChildPropertyDescriptor MODULE_QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(ModuleQualifiedName.class, "moduleQualifier", SimpleName.class, true); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}). *
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(ModuleQualifiedName.class, "name", QualifiedName.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(ModuleQualifiedName.class, propertyList);
        addProperty(MODULE_QUALIFIER_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The identifier; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile Name moduleQualifier;

    /**
     * The name being module veysqualified; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name name = null;

    /**
     * Creates a new AST node for a module qualified name owned by the given AST. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ModuleQualifiedName(AST ast) {
        super(ast);
        unsupportedBelow15();
    }

    @Override
    final int getNodeType0() {
        return 105;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getModuleQualifier());
            acceptChild(visitor, getName());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the qualifier part of this qualified name.
     *
     * @return the qualifier part of this qualified name
     */
    public Name getModuleQualifier() {
        if (this.moduleQualifier == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.moduleQualifier == null) {
                    this.moduleQualifier = postLazyInit(new SimpleName(this.ast), MODULE_QUALIFIER_PROPERTY);
                }
            }
        }
        return this.moduleQualifier;
    }

    /**
     * Sets the qualifier of this qualified name to the given name.
     *
     * @param moduleQualifier the qualifier of this qualified name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setModuleQualifier(Name moduleQualifier) {
        if (moduleQualifier == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.moduleQualifier;
        preReplaceChild(oldChild, moduleQualifier, MODULE_QUALIFIER_PROPERTY);
        this.moduleQualifier = moduleQualifier;

    }

    /**
     * Returns the name part of this qualified name.
     *
     * @return the name being qualified
     */
    public Name getName() {
        return this.name;
    }

    /**
     * Sets the name part of this qualified name to the given simple name.
     *
     * @param name the identifier of this qualified name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {
        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }

    @Override
    void appendName(StringBuilder buffer) {
        getModuleQualifier().appendName(buffer);
        buffer.append('/');
        if (getName() != null) {
            getName().appendName(buffer);
        }
    }
}
