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
 * Abstract base class of AST nodes that represent exports and opens directives (added in JLS9 API).
 *
 * <pre>
 * ModulePackageAccess:
 *    {@link ExportsDirective}
 *    {@link OpensDirective}
 * </pre>
 *
 * @noextend This class is not intended to be subclassed by clients.
 * @since 3.14
 */
@SuppressWarnings({ "rawtypes" })
public abstract class ModulePackageAccess extends ModuleDirective {

    /**
     * The package name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    protected Name name;

    /**
     * The target modules (element type: {@link Name}). Defaults to an empty list. (see constructor)
     */
    protected ASTNode.NodeList modules = null;

    /**
     * Returns structural property descriptor for the "modules" property of this node (element type: {@link Name}).
     *
     * @return the property descriptor
     */
    abstract ChildListPropertyDescriptor internalModulesProperty();

    /**
     * Returns structural property descriptor for the "name" property of this node (child type: {@link Name}).
     *
     * @return the property descriptor
     */
    abstract ChildPropertyDescriptor internalNameProperty();

    /**
     * Creates and returns a structural property descriptor for the "name" property declared on the given concrete node
     * type (child type: {@link Name}).
     *
     * @return the property descriptor
     */
    static ChildPropertyDescriptor internalNamePropertyFactory() {
        return new ChildPropertyDescriptor(Name.class, false);
    }

    /**
     * Creates and returns a structural property descriptor for the "modules" property declared on the given concrete
     * node type (element type: {@link Name}).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalModulesPropertyFactory() {
        return new ChildListPropertyDescriptor(Name.class, false);
    }

    /**
     * <p> N.B. This constructor is package-private; all subclasses must be declared in the same package; clients are
     * unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ModulePackageAccess(AST ast) {
        super(ast);
        this.modules = new ASTNode.NodeList(internalModulesProperty());
    }

    /**
     * Returns the name of the package.
     *
     * @return the package name node
     */
    public Name getName() {
        if (this.name == null) {
            this.name = postLazyInit(this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)),
                internalNameProperty());
        }
        return this.name;
    }

    /**
     * Sets the name of the package to the given name.
     *
     * @param name the new package name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.name;
        ChildPropertyDescriptor p = internalNameProperty();
        preReplaceChild(oldChild, name, p);
        this.name = name;

    }

    /**
     * Returns the live ordered list of target modules for this directive.
     *
     * @return the live list of target modules (element type: {@link Name})
     */
    public List modules() {
        return this.modules;
    }

    protected void acceptVisitChildren(boolean visitChildren, ASTVisitor visitor) {
        if (visitChildren) {
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.modules);
        }
    }
}
