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

import java.util.ArrayList;
import java.util.List;

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
 * Although allowed at the AST, not all arrangements of AST nodes are meaningful; in particular, only class and enum
 * declarations are meaningful in the context of a block.
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class TypeDeclarationStatement extends Statement {

    /**
     * The "typeDeclaration" structural property of this node type (child type: {@link TypeDeclaration}) (JLS2 API
     * only).
     *
     * @since 3.0
     * @deprecated In the JLS3 API, this property is replaced by {@link #DECLARATION_PROPERTY}.
     */
    public static final ChildPropertyDescriptor TYPE_DECLARATION_PROPERTY
        = new ChildPropertyDescriptor(TypeDeclarationStatement.class, "typeDeclaration", TypeDeclaration.class, true); //$NON-NLS-1$

    /**
     * The "declaration" structural property of this node type (child type: {@link AbstractTypeDeclaration}) (added in
     * JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor DECLARATION_PROPERTY = new ChildPropertyDescriptor(
        TypeDeclarationStatement.class, "declaration", AbstractTypeDeclaration.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(TypeDeclarationStatement.class, propertyList);
        addProperty(TYPE_DECLARATION_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(2);
        createPropertyList(TypeDeclarationStatement.class, propertyList);
        addProperty(DECLARATION_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The type declaration; lazily initialized; defaults to a unspecified, but legal, type declaration. In JLS2,
     * corresponds to TYPE_DECLARATION_PROPERTY. After JLS2, corresponds to DECLARATION_PROPERTY.
     *
     * @see #typeDeclProperty
     */
    private volatile AbstractTypeDeclaration typeDecl;

    /**
     * The child property stored on the <code>typeDecl</code> instance variable. In JLS2, corresponds to
     * TYPE_DECLARATION_PROPERTY. After JLS2, corresponds to DECLARATION_PROPERTY.
     *
     * @return the property corresponding to the <code>typeDecl</code> instance variable; never <code>null</code>
     */
    private ChildPropertyDescriptor typeDeclProperty() {
        if (getAST().apiLevel() == 2) {
            return TYPE_DECLARATION_PROPERTY;
        } else {
            return DECLARATION_PROPERTY;
        }
    }

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
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getDeclaration());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the abstract type declaration of this local type declaration statement (added in JLS3 API).
     *
     * @return the type declaration node
     * @since 3.1
     */
    public AbstractTypeDeclaration getDeclaration() {
        if (this.typeDecl == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.typeDecl == null) {
                    this.typeDecl = postLazyInit(new TypeDeclaration(this.ast), typeDeclProperty());
                }
            }
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
        if (decl == null) {
            throw new IllegalArgumentException();
        }
        // a TypeDeclarationStatement may occur inside an
        // TypeDeclaration - must check cycles
        ASTNode oldChild = this.typeDecl;
        ChildPropertyDescriptor typeDeclProperty = typeDeclProperty();
        preReplaceChild(oldChild, decl, typeDeclProperty);
        this.typeDecl = decl;

    }

    /**
     * Returns the type declaration of this local type declaration statement (JLS2 API only).
     *
     * @return the type declaration node
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS2
     * @deprecated In the JLS3 API, this method is replaced by {@link #getDeclaration()}, which returns
     * <code>AbstractTypeDeclaration</code> instead of <code>TypeDeclaration</code>.
     */
    public TypeDeclaration getTypeDeclaration() {
        return internalGetTypeDeclaration();
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.1
     */
    /* package */ final TypeDeclaration internalGetTypeDeclaration() {
        supportedOnlyIn2();
        return (TypeDeclaration) getDeclaration();
    }

}
