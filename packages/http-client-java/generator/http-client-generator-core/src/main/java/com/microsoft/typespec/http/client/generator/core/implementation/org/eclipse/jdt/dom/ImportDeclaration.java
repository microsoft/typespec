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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

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
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS23
     * API).
     *
     * @since 3.40
     * @noreference preview feature
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(IExtendedModifier.class, true);

    /**
     * The import name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name importName;

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
        this.modifiers = new ASTNode.NodeList(MODIFIERS_PROPERTY);
    }

    /**
     * Returns the live ordered list of modifiers of this declaration (added in JLS23 API).
     *
     * @return the live list of modifiers (element type: {@link IExtendedModifier})
     * @since 3.39
     * @noreference preview feature
     */
    public List modifiers() {
        // $NON-NLS-1$
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
            acceptChildren(visitor, this.modifiers);
        }

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
            this.importName = postLazyInit(
                this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)), NAME_PROPERTY);
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

        ASTNode oldChild = this.importName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.importName = name;

    }

    /**
     * Sets whether this import declaration is an on-demand or a single-type import.
     */
    public void setOnDemand() {
        preValueChange();

    }

}
