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
 * AST node for a qualified name. A qualified name is defined recursively as a simple name preceded by a name, which
 * qualifies it. Expressing it this way means that the qualifier and the simple name get their own AST nodes.
 *
 * <pre>
 * QualifiedName:
 *    Name <b>.</b> SimpleName
 * </pre>
 *
 * <p> See <code>FieldAccess</code> for guidelines on handling other expressions that resemble qualified names. </p>
 *
 * @see FieldAccess
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class QualifiedName extends Name {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(QualifiedName.class, "qualifier", Name.class, true); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(QualifiedName.class, "name", SimpleName.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(QualifiedName.class, propertyList);
        addProperty(QUALIFIER_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The identifier; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile Name qualifier;

    /**
     * The name being qualified; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile SimpleName name;

    /**
     * Creates a new AST node for a qualified name owned by the given AST. <p> N.B. This constructor is package-private;
     * all subclasses must be declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    QualifiedName(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 40;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getQualifier());
            acceptChild(visitor, getName());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the qualifier part of this qualified name.
     *
     * @return the qualifier part of this qualified name
     */
    public Name getQualifier() {
        if (this.qualifier == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.qualifier == null) {
                    this.qualifier = postLazyInit(new SimpleName(this.ast), QUALIFIER_PROPERTY);
                }
            }
        }
        return this.qualifier;
    }

    /**
     * Sets the qualifier of this qualified name to the given name.
     *
     * @param qualifier the qualifier of this qualified name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setQualifier(Name qualifier) {
        if (qualifier == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.qualifier;
        preReplaceChild(oldChild, qualifier, QUALIFIER_PROPERTY);
        this.qualifier = qualifier;

    }

    /**
     * Returns the name part of this qualified name.
     *
     * @return the name being qualified
     */
    public SimpleName getName() {
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
     * Sets the name part of this qualified name to the given simple name.
     *
     * @param name the identifier of this qualified name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }

    @Override
    void appendName(StringBuilder buffer) {
        getQualifier().appendName(buffer);
        buffer.append('.');
        getName().appendName(buffer);
    }
}
