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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * AST node for a parameter within a method reference ({@link MethodRef}). These nodes only occur within doc comments
 * ({@link Javadoc}).
 *
 * <pre>
 * MethodRefParameter:
 * 		Type [ <b>...</b> ] [ Identifier ]
 * </pre>
 *
 * <p> Note: The 1.5 spec for the Javadoc tool does not mention the possibility of a variable arity indicator in method
 * references. However, the 1.5 Javadoc tool itself does indeed support it. Since it makes sense to have a way to
 * explicitly refer to variable arity methods, it seems more likely that the Javadoc spec is wrong in this case. </p>
 *
 * @see Javadoc
 * @since 3.0
 */
public class MethodRefParameter extends ASTNode {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The type; lazily initialized; defaults to a unspecified, legal type.
     */
    private Type type;

    /**
     * The parameter name, or <code>null</code> if none; none by default.
     */
    private SimpleName optionalParameterName = null;

    /**
     * Creates a new AST node for a method referenece parameter owned by the given AST. By default, the node has an
     * unspecified (but legal) type, not variable arity, and no parameter name. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    MethodRefParameter(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 69;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        // visit children in normal left to right reading order
        acceptChild(visitor, getType());
        acceptChild(visitor, getName());
    }

    /**
     * Returns the paramter type.
     *
     * @return the parameter type
     */
    public Type getType() {
        if (this.type == null) {
            this.type = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
        }
        return this.type;
    }

    /**
     * Sets the paramter type to the given type.
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the type is <code>null</code></li> <li>the node belongs to a
     * different AST</li> <li>the node already has a parent</li> </ul>
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
     * Returns the parameter name, or <code>null</code> if there is none.
     *
     * @return the parameter name node, or <code>null</code> if there is none
     */
    public SimpleName getName() {
        return this.optionalParameterName;
    }

    /**
     * Sets or clears the parameter name.
     *
     * @param name the parameter name node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {
        ASTNode oldChild = this.optionalParameterName;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.optionalParameterName = name;

    }
}
