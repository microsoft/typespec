// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2013 IBM Corporation and others.
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
 * AST node for a member reference within a doc comment ({@link Javadoc}). The principal uses of these are in "@see" and
 * "@link" tag elements, for references to field members (and occasionally to method and constructor members).
 *
 * <pre>
 * MemberRef:
 * 		[ Name ] <b>#</b> Identifier
 * </pre>
 *
 * @see Javadoc
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class MemberRef extends ASTNode implements IDocElement {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(MemberRef.class, "qualifier", Name.class, false); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(MemberRef.class, "name", SimpleName.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(MemberRef.class, propertyList);
        addProperty(QUALIFIER_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The optional qualifier; <code>null</code> for none; defaults to none.
     */
    private Name optionalQualifier = null;

    /**
     * The member name; lazily initialized; defaults to a unspecified, legal Java method name.
     */
    private volatile SimpleName memberName;

    /**
     * Creates a new AST node for a member reference owned by the given AST. By default, the method reference is for a
     * member with an unspecified, but legal, name; and no qualifier. <p> N.B. This constructor is package-private; all
     * subclasses must be declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    MemberRef(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 67;
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
     * Returns the qualifier of this member reference, or <code>null</code> if there is none.
     *
     * @return the qualifier name node, or <code>null</code> if there is none
     */
    public Name getQualifier() {
        return this.optionalQualifier;
    }

    /**
     * Sets or clears the qualifier of this member reference.
     *
     * @param name the qualifier name node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setQualifier(Name name) {
        ASTNode oldChild = this.optionalQualifier;
        preReplaceChild(oldChild, name, QUALIFIER_PROPERTY);
        this.optionalQualifier = name;

    }

    /**
     * Returns the name of the referenced member.
     *
     * @return the member name node
     */
    public SimpleName getName() {
        if (this.memberName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.memberName == null) {
                    this.memberName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
        }
        return this.memberName;
    }

    /**
     * Sets the name of the referenced member to the given name.
     *
     * @param name the new member name node
     * @exception IllegalArgumentException if: <ul> <li>the name is <code>null</code></li> <li>the node belongs to a
     * different AST</li> <li>the node already has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.memberName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.memberName = name;

    }
}
