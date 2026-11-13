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
 * Creation reference expression AST node type (added in JLS8 API).
 *
 * <pre>
 * CreationReference:
 *     Type <b>::</b>
 *         [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *         <b>new</b>
 * </pre>
 *
 * @since 3.10
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class CreationReference extends MethodReference {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY
        = new ChildPropertyDescriptor(CreationReference.class, "type", Type.class, false); //$NON-NLS-1$

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = internalTypeArgumentsFactory(CreationReference.class);

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(CreationReference.class, propertyList);
        addProperty(TYPE_PROPERTY, propertyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The type; lazily initialized; defaults to an unspecified type.
     */
    private volatile Type type;

    /**
     * Creates a new AST node for an CreationReference declaration owned by the given AST. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    CreationReference(AST ast) {
        super(ast);
        unsupportedIn2_3_4();
    }

    @Override
    final ChildListPropertyDescriptor internalTypeArgumentsProperty() {
        return TYPE_ARGUMENTS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 89;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getType());
            acceptChildren(visitor, this.typeArguments);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the type of this creation reference expression.
     *
     * @return the type node
     */
    public Type getType() {
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(new SimpleType(this.ast), TYPE_PROPERTY);
                }
            }
        }
        return this.type;
    }

    /**
     * Sets the type of this creation reference expression.
     *
     * @param type the new type node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.type;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.type = type;

    }

    /**
     * Returns the live ordered list of type arguments of this creation reference expression.
     *
     * @return the live list of type arguments (element type: {@link Type})
     */

    public List typeArguments() {
        return this.typeArguments;
    }
}
