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

/**
 * Local type declaration statement AST node type. <p> This kind of node is used to convert a type declaration node into
 * a statement node by wrapping it. </p>
 *
 * <pre>
 * TypeDeclarationStatement:
 *    TypeDeclaration
 *    EnumDeclaration
 * </pre>
 *
 * <p>
 * Although allowed at the AST, not all arrangements of AST nodes are meaningful; in particular, only class and enum
 * declarations are meaningful in the context of a block.
 *
 * @since 2.0
 */
public class TypeDeclarationStatement extends Statement {

    /**
     * The "declaration" structural property of this node type (child type: {@link AbstractTypeDeclaration}) (added in
     * JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor DECLARATION_PROPERTY
        = new ChildPropertyDescriptor(AbstractTypeDeclaration.class, true);

    /**
     * The type declaration ({@link #DECLARATION_PROPERTY}); lazily initialized; defaults to a unspecified, but legal,
     * type declaration.
     */
    private AbstractTypeDeclaration typeDecl;

    /**
     * Creates a new unparented local type declaration statement node owned by the given AST. By default, the local type
     * declaration is an unspecified, but legal, type declaration. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    TypeDeclarationStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 56;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        acceptChild(visitor, getDeclaration());
    }

    /**
     * Returns the abstract type declaration of this local type declaration statement (added in JLS3 API).
     *
     * @return the type declaration node
     * @since 3.1
     */
    public AbstractTypeDeclaration getDeclaration() {
        if (this.typeDecl == null) {
            this.typeDecl = postLazyInit(new TypeDeclaration(this.ast), TypeDeclarationStatement.DECLARATION_PROPERTY);
        }
        return this.typeDecl;
    }

    /**
     * Sets the abstract type declaration of this local type declaration statement (added in JLS3 API).
     *
     * @param decl the type declaration node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.1
     */
    public void setDeclaration(AbstractTypeDeclaration decl) {
        // a TypeDeclarationStatement may occur inside an
        // TypeDeclaration - must check cycles
        ASTNode oldChild = this.typeDecl;

        preReplaceChild(oldChild, decl, TypeDeclarationStatement.DECLARATION_PROPERTY);
        this.typeDecl = decl;

    }

}
