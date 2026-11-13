// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
 * Super method reference AST node type (added in JLS8 API).
 *
 * <pre>
 * SuperMethodReference:
 *     [ ClassName <b>.</b> ] <b>super</b> <b>::</b>
 *         [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *         Identifier
 * </pre>
 *
 * @since 3.10
 * @noinstantiate This class is not intended to be instantiated by clients
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class SuperMethodReference extends MethodReference {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(SuperMethodReference.class, "qualifier", Name.class, false); //$NON-NLS-1$

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = internalTypeArgumentsFactory(SuperMethodReference.class);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(SuperMethodReference.class, "name", SimpleName.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(4);
        createPropertyList(SuperMethodReference.class, propertyList);
        addProperty(QUALIFIER_PROPERTY, propertyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
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
     * Creates a new AST node for a super method reference owned by the given AST. By default, there is no qualifier.
     * <p> N.B. This constructor is package-private; all subclasses must be declared in the same package; clients are
     * unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    SuperMethodReference(AST ast) {
        super(ast);
        unsupportedIn2_3_4();
    }

    @Override
    final ChildListPropertyDescriptor internalTypeArgumentsProperty() {
        return TYPE_ARGUMENTS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 91;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getQualifier());
            acceptChildren(visitor, this.typeArguments);
            acceptChild(visitor, getName());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the qualifier of this "super" method reference, or <code>null</code> if there is none.
     *
     * @return the qualifier name node, or <code>null</code> if there is none
     */
    public Name getQualifier() {
        return this.optionalQualifier;
    }

    /**
     * Sets the qualifier of this "super" method reference expression.
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
     * Returns the live ordered list of type arguments of this super method reference.
     *
     * @return the live list of type arguments (element type: {@link Type})
     */

    public List typeArguments() {
        return this.typeArguments;
    }

    /**
     * Returns the name of the method referenced in this expression.
     *
     * @return the method name node
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
     * Sets the name of the method referenced in this expression to the given name.
     *
     * @param name the new method name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        if (name == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.methodName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.methodName = name;

    }
}
