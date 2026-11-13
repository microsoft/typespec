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
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class MethodRefParameter extends ASTNode {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY
        = new ChildPropertyDescriptor(MethodRefParameter.class, "type", Type.class, false); //$NON-NLS-1$

    /**
     * The "varargs" structural property of this node type (type: {@link Boolean}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final SimplePropertyDescriptor VARARGS_PROPERTY
        = new SimplePropertyDescriptor(MethodRefParameter.class, "varargs", boolean.class); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(MethodRefParameter.class, "name", SimpleName.class, false); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(MethodRefParameter.class, properyList);
        addProperty(TYPE_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(3);
        createPropertyList(MethodRefParameter.class, properyList);
        addProperty(TYPE_PROPERTY, properyList);
        addProperty(VARARGS_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The type; lazily initialized; defaults to a unspecified, legal type.
     */
    private volatile Type type;

    /**
     * Indicates the last parameter of a variable arity method; defaults to false.
     *
     * @since 3.1
     */
    private boolean variableArity = false;

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
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getType());
            acceptChild(visitor, getName());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the paramter type.
     *
     * @return the parameter type
     */
    public Type getType() {
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
                }
            }
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
     * Returns whether this method reference parameter is for the last parameter of a variable arity method (added in
     * JLS3 API). <p> Note that the binding for the type <code>Foo</code>in the vararg method reference
     * <code>#fun(Foo...)</code> is always for the type as written; i.e., the type binding for <code>Foo</code>.
     * However, if you navigate from the MethodRef to its method binding to the type binding for its last parameter, the
     * type binding for the vararg parameter is always an array type (i.e., <code>Foo[]</code>) reflecting the way
     * vararg methods get compiled. </p>
     *
     * @return <code>true</code> if this is a variable arity parameter, and <code>false</code> otherwise
     * @exception UnsupportedOperationException if this operation is used in a JLS2 AST
     * @since 3.1
     */
    public boolean isVarargs() {
        unsupportedIn2();
        return this.variableArity;
    }

    /**
     * Sets whether this method reference parameter is for the last parameter of a variable arity method (added in JLS3
     * API).
     *
     * @param variableArity <code>true</code> if this is a variable arity parameter, and <code>false</code> otherwise
     * @since 3.1
     */
    public void setVarargs(boolean variableArity) {
        unsupportedIn2();
        preValueChange();
        this.variableArity = variableArity;

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
