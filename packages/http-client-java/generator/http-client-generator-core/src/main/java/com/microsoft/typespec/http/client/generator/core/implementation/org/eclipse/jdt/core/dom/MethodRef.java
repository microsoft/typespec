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
 * AST node for a method or constructor reference within a doc comment ({@link Javadoc}). The principal uses of these
 * are in "@see" and "@link" tag elements, for references to method and constructor members.
 *
 * <pre>
 * MethodRef:
 *     [ Name ] <b>#</b> Identifier
 *         <b>(</b> [ MethodRefParameter | { <b>,</b> MethodRefParameter } ] <b>)</b>
 * </pre>
 *
 * @see Javadoc
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class MethodRef extends ASTNode implements IDocElement {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(MethodRef.class, "qualifier", Name.class, false); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(MethodRef.class, "name", SimpleName.class, false); //$NON-NLS-1$

    /**
     * The "parameters" structural property of this node type (element type: {@link MethodRefParameter}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(MethodRef.class, "parameters", MethodRefParameter.class, false); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(4);
        createPropertyList(MethodRef.class, properyList);
        addProperty(QUALIFIER_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(PARAMETERS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The optional qualifier; <code>null</code> for none; defaults to none.
     */
    private Name optionalQualifier = null;

    /**
     * The method name; lazily initialized; defaults to a unspecified, legal Java method name.
     */
    private volatile SimpleName methodName;

    /**
     * The parameter declarations (element type: {@link MethodRefParameter}). Defaults to an empty list.
     */
    private final ASTNode.NodeList parameters = new ASTNode.NodeList(PARAMETERS_PROPERTY);

    /**
     * Creates a new AST node for a method reference owned by the given AST. By default, the method reference is for a
     * method with an unspecified, but legal, name; no qualifier; and an empty parameter list. <p> N.B. This constructor
     * is package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    MethodRef(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 68;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getQualifier());
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.parameters);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the qualifier of this method reference, or <code>null</code> if there is none.
     *
     * @return the qualifier name node, or <code>null</code> if there is none
     */
    public Name getQualifier() {
        return this.optionalQualifier;
    }

    /**
     * Sets or clears the qualifier of this method reference.
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
     * Returns the name of the referenced method or constructor.
     *
     * @return the method or constructor name node
     */
    public SimpleName getName() {
        if (this.methodName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.methodName == null) {
                    this.methodName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
        }
        return this.methodName;
    }

    /**
     * Sets the name of the referenced method or constructor to the given name.
     *
     * @param name the new method or constructor name node
     * @exception IllegalArgumentException if: <ul> <li>the name is <code>null</code></li> <li>the node belongs to a
     * different AST</li> <li>the node already has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.methodName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.methodName = name;

    }

    /**
     * Returns the live ordered list of method parameter references for this method reference.
     *
     * @return the live list of method parameter references (element type: {@link MethodRefParameter})
     */
    public List parameters() {
        return this.parameters;
    }
}
