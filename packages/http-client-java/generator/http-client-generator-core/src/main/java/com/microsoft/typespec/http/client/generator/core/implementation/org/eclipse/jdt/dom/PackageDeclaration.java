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
 * Package declaration AST node type.
 *
 * <pre>
 * PackageDeclaration:
 *    [ Javadoc ] { Annotation } <b>package</b> Name <b>;</b>
 * </pre>
 *
 * <p>
 * Note that the standard AST parser only recognizes a Javadoc comment immediately preceding the package declaration
 * when it occurs in the special <code>package-info.java</code> compilation unit (JLS3 7.4.1.1). The Javadoc comment in
 * that file contains the package description.
 *
 * @since 2.0
 */
public class PackageDeclaration extends ASTNode {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}) (added in JLS3 API).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = new ChildPropertyDescriptor(Javadoc.class, false);

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(Annotation.class, true);

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The doc comment, or <code>null</code> if none. Defaults to none.
     *
     * @since 3.0
     */
    Javadoc optionalDocComment = null;

    /**
     * The annotations (element type: {@link Annotation}). Null in JLS2. Added in JLS3; defaults to an empty list (see
     * constructor).
     *
     * @since 3.1
     */
    private final ASTNode.NodeList<Annotation> annotations;

    /**
     * The package name; lazily initialized; defaults to a unspecified, legal Java package identifier.
     */
    private Name packageName;

    /**
     * Creates a new AST node for a package declaration owned by the given AST. The package declaration initially has an
     * unspecified, but legal, Java identifier; and an empty list of annotations. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    PackageDeclaration(AST ast) {
        super(ast);
        this.annotations = new ASTNode.NodeList<>(ANNOTATIONS_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 35;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.annotations);
            acceptChild(visitor, getName());
        }

    }

    /**
     * Returns the live ordered list of annotations of this package declaration (added in JLS3 API).
     *
     * @return the live list of annotations (element type: {@link Annotation})
     * @since 3.1
     */
    public List<Annotation> annotations() {
        return this.annotations;
    }

    /**
     * Returns the doc comment node (added in JLS3 API).
     *
     * @return the doc comment node, or <code>null</code> if none
     * @since 3.0
     */
    public Javadoc getJavadoc() {
        return this.optionalDocComment;
    }

    /**
     * Sets or clears the doc comment node (added in JLS3 API).
     *
     * @param docComment the doc comment node, or <code>null</code> if none
     * @exception IllegalArgumentException if the doc comment string is invalid
     * @since 3.0
     */
    public void setJavadoc(Javadoc docComment) {
        ASTNode oldChild = this.optionalDocComment;
        preReplaceChild(oldChild, docComment, JAVADOC_PROPERTY);
        this.optionalDocComment = docComment;

    }

    /**
     * Returns the package name of this package declaration.
     *
     * @return the package name node
     */
    public Name getName() {
        if (this.packageName == null) {
            this.packageName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.packageName;
    }

    /**
     * Sets the package name of this package declaration to the given name.
     *
     * @param name the new package name
     * @exception IllegalArgumentException if`: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.packageName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.packageName = name;

    }
}
