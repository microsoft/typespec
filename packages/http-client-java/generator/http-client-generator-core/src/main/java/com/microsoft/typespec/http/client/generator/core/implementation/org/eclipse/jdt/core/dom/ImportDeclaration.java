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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.Modifier.ModifierKeyword;
import java.util.ArrayList;
import java.util.List;

/**
 * Import declaration AST node type.
 *
 * <pre>
 * ImportDeclaration:
 *    <b>import</b> [ <b>static</b> ] Name [ <b>.</b> <b>*</b> ] <b>;</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ImportDeclaration extends ASTNode {

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(ImportDeclaration.class, "name", Name.class, false); //$NON-NLS-1$

    /**
     * The "onDemand" structural property of this node type (type: {@link Boolean}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor ON_DEMAND_PROPERTY
        = new SimplePropertyDescriptor(ImportDeclaration.class, "onDemand", boolean.class); //$NON-NLS-1$

    /**
     * The "static" structural property of this node type (type: {@link Boolean}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final SimplePropertyDescriptor STATIC_PROPERTY
        = new SimplePropertyDescriptor(ImportDeclaration.class, "static", boolean.class); //$NON-NLS-1$

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS23
     * API).
     *
     * @since 3.40
     * @noreference preview feature
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(ImportDeclaration.class, "modifiers", IExtendedModifier.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(ImportDeclaration.class, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ON_DEMAND_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(4);
        createPropertyList(ImportDeclaration.class, properyList);
        addProperty(STATIC_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ON_DEMAND_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(5);
        createPropertyList(ImportDeclaration.class, properyList);
        addProperty(STATIC_PROPERTY, properyList);
        addProperty(MODIFIERS_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(ON_DEMAND_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The import name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile Name importName;

    /**
     * On demand versus single type import; defaults to single type import.
     */
    private boolean onDemand = false;

    /**
     * Static versus regular; defaults to regular import. Added in JLS3; not used in JLS2.
     *
     * @since 3.1
     */
    private boolean isStatic = false;

    /**
     * The extended modifiers (element type: {@link IExtendedModifier}). Added in JLS23; defaults to an empty list (see
     * constructor).
     *
     * @since 3.39
     */
    private ASTNode.NodeList modifiers = null;

    /**
     * Creates a new AST node for an import declaration owned by the given AST. The import declaration initially is a
     * regular (non-static) single type import for an unspecified, but legal, Java type name. <p> N.B. This constructor
     * is package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    ImportDeclaration(AST ast) {
        super(ast);
        if (ast.apiLevel >= 23) {
            this.modifiers = new ASTNode.NodeList(MODIFIERS_PROPERTY);
        }
    }

    /**
     * Returns the live ordered list of modifiers of this declaration (added in JLS23 API).
     *
     * @return the live list of modifiers (element type: {@link IExtendedModifier})
     * @exception UnsupportedOperationException if this operation is used in an AST below JLS23
     * @since 3.39
     * @noreference preview feature
     */
    public List modifiers() {
        if (this.ast.apiLevel < 23)
            throw new UnsupportedOperationException("Operation not supported in AST below JLS23"); //$NON-NLS-1$
        return this.modifiers;
    }

    @Override
    final int getNodeType0() {
        return 26;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getName());
            if (this.ast.apiLevel >= 23) {
                acceptChildren(visitor, this.modifiers);
            }
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the name imported by this declaration. <p> For a regular on-demand import, this is the name of a package.
     * For a static on-demand import, this is the qualified name of a type. For a regular single-type import, this is
     * the qualified name of a type. For a static single-type import, this is the qualified name of a static member of a
     * type. </p>
     *
     * @return the imported name node
     */
    public Name getName() {
        if (this.importName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.importName == null) {
                    this.importName = postLazyInit(
                        this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)), NAME_PROPERTY);
                }
            }
        }
        return this.importName;
    }

    /**
     * Sets the name of this import declaration to the given name. <p> For a regular on-demand import, this is the name
     * of a package. For a static on-demand import, this is the qualified name of a type. For a regular single-type
     * import, this is the qualified name of a type. For a static single-type import, this is the qualified name of a
     * static member of a type. </p>
     *
     * @param name the new import name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.importName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.importName = name;

    }

    /**
     * Returns whether this import declaration is an on-demand or a single-type import.
     *
     * @return <code>true</code> if this is an on-demand import, and <code>false</code> if this is a single type import
     */
    public boolean isOnDemand() {
        return this.onDemand;
    }

    /**
     * Sets whether this import declaration is an on-demand or a single-type import.
     *
     * @param onDemand <code>true</code> if this is an on-demand import, and <code>false</code> if this is a single type
     * import
     */
    public void setOnDemand(boolean onDemand) {
        preValueChange();
        this.onDemand = onDemand;

    }

    /**
     * Returns whether this import declaration is a static import (added in JLS3 API).
     *
     * @return <code>true</code> if this is a static import, and <code>false</code> if this is a regular import
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public boolean isStatic() {
        if (this.modifiers != null) {
            // JLS23 behavior: extract from the list of Modifier
            for (Object x : modifiers()) {
                if (x instanceof Modifier modifier && modifier.isStatic()) {
                    return true;
                }
            }
            return false;
        }
        unsupportedIn2();
        return this.isStatic;
    }

    /**
     * Sets whether this import declaration is a static import (added in JLS3 API).
     *
     * Note, that in JLS23 API this method creates a {@link Modifier} without source positions (or removes, if
     * {@code isStatic == false}), so it should not be invoked in situations where valid source positions are required.
     *
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     *
     * @see #modifiers()
     */
    @SuppressWarnings("unchecked")
    public void setStatic() {

        if (this.ast.apiLevel >= 23) {
            List<Modifier> mods = modifiers();
            for (Modifier mod : mods) {
                if (mod.isStatic()) {
                    {
                    }
                    return;
                }
            }
            {
                Modifier newMod = this.ast.newModifier(ModifierKeyword.STATIC_KEYWORD);
                this.modifiers.add(newMod);
            }
            return;
        }
        unsupportedIn2();
        preValueChange();
        this.isStatic = true;

    }
}
