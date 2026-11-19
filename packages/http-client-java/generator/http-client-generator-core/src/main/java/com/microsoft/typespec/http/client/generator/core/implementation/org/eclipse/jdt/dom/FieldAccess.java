// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Field access expression AST node type.
 *
 * <pre>
 * FieldAccess:
 * 		Expression <b>.</b> Identifier
 * </pre>
 *
 * <p> Note that there are several kinds of expressions that resemble field access expressions: qualified names, this
 * expressions, and super field access expressions. The following guidelines help with correct usage: </p> <ul> <li>An
 * expression like "foo.this" can only be represented as a this expression (<code>ThisExpression</code>) containing a
 * simple name. "this" is a keyword, and therefore invalid as an identifier.</li> <li>An expression like "this.foo" can
 * only be represented as a field access expression (<code>FieldAccess</code>) containing a this expression and a simple
 * name. Again, this is because "this" is a keyword, and therefore invalid as an identifier.</li> <li>An expression with
 * "super" can only be represented as a super field access expression (<code>SuperFieldAccess</code>). "super" is a also
 * keyword, and therefore invalid as an identifier.</li> <li>An expression like "foo.bar" can be represented either as a
 * qualified name (<code>QualifiedName</code>) or as a field access expression (<code>FieldAccess</code>) containing
 * simple names. Either is acceptable, and there is no way to choose between them without information about what the
 * names resolve to (<code>ASTParser</code> may return either).</li> <li>Other expressions ending in an identifier, such
 * as "foo().bar" can only be represented as field access expressions (<code>FieldAccess</code>).</li> </ul>
 *
 * @see QualifiedName
 * @see ThisExpression
 * @see SuperFieldAccess
 * @since 2.0
 */
public class FieldAccess extends Expression {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The expression; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Expression expression;

    /**
     * The field; lazily initialized; defaults to an unspecified, but legal, simple field name.
     */
    private SimpleName fieldName;

    /**
     * Creates a new unparented node for a field access expression owned by the given AST. By default, the expression
     * and field are both unspecified, but legal, names. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    FieldAccess(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 22;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getExpression());
            acceptChild(visitor, getName());
        }

    }

    /**
     * Returns the expression of this field access expression.
     *
     * @return the expression node
     */
    public Expression getExpression() {
        if (this.expression == null) {
            this.expression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
        }
        return this.expression;
    }

    /**
     * Sets the expression of this field access expression.
     *
     * @param expression the new expression
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setExpression(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.expression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.expression = expression;

    }

    /**
     * Returns the name of the field accessed in this field access expression.
     *
     * @return the field name
     */
    public SimpleName getName() {
        if (this.fieldName == null) {
            this.fieldName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.fieldName;
    }

    /**
     * Sets the name of the field accessed in this field access expression.
     *
     * @param fieldName the field name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName fieldName) {

        ASTNode oldChild = this.fieldName;
        preReplaceChild(oldChild, fieldName, NAME_PROPERTY);
        this.fieldName = fieldName;

    }
}
