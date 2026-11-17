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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Lambda expression AST node type (added in JLS8 API).
 *
 * <pre>
 * LambdaExpression:
 *    Identifier <b>-></b> Body
 *    <b>(</b> [ Identifier { <b>,</b> Identifier } ] <b>)</b> <b>-></b> Body
 *    <b>(</b> [ FormalParameter { <b>,</b> FormalParameter } ] <b>)</b> <b>-></b> Body
 * </pre>
 *
 * <p> The first two forms use {@link VariableDeclarationFragment} for the parameter or parameters, while the third form
 * uses {@link SingleVariableDeclaration}.</p> <p>The Body can be either a {@link Block} or an {@link Expression}.</p>
 *
 * @since 3.10
 * @noinstantiate This class is not intended to be instantiated by clients
 */
@SuppressWarnings({ "rawtypes" })
public class LambdaExpression extends Expression {

    /**
     * The "parameters" structural property of this node type (element type: {@link VariableDeclaration}). <p> Note that
     * all elements must be of the same type, either all {@link SingleVariableDeclaration} or all
     * {@link VariableDeclarationFragment}. </p>
     */
    public static final ChildListPropertyDescriptor PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(VariableDeclaration.class, true);

    /**
     * The "body" structural property of this node type (child type: {@link ASTNode}, must be either a {@link Block} or
     * an {@link Expression}).
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY = new ChildPropertyDescriptor(ASTNode.class, true);

    /**
     * Indicates whether parentheses are present or not. Defaults to <code>true</code>.
     */
    private boolean hasParentheses = true;

    /**
     * The parameter declarations (element type: {@link VariableDeclaration}). Defaults to an empty list.
     */
    private final ASTNode.NodeList parameters = new ASTNode.NodeList(PARAMETERS_PROPERTY);

    /**
     * The method body. The method body; lazily initialized, defaults to an empty Block.
     */
    private ASTNode body;

    /**
     * Creates a new AST node for a LambdaExpression declaration owned by the given AST. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    LambdaExpression(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 86;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.parameters);
            acceptChild(visitor, getBody());
        }

    }

    /**
     * Returns whether parentheses around the parameters are present or not. <p> Note that parentheses are required
     * unless {@link #parameters()} contains just a single {@link VariableDeclarationFragment}. ASTRewrite may ignore
     * this property if necessary. </p>
     *
     * @return <code>true</code> if this lambda expression has parentheses around its parameters and <code>false</code>
     * otherwise
     */
    public boolean hasParentheses() {
        return this.hasParentheses;
    }

    /**
     * Sets whether this lambda expression has parentheses around its parameters or not. <p> Note that parentheses are
     * required unless {@link #parameters()} contains just a single {@link VariableDeclarationFragment}. ASTRewrite may
     * ignore this property if necessary. </p>
     *
     * @param hasParentheses <code>true</code> if this lambda expression has parentheses around its parameters and
     * <code>false</code> otherwise
     */
    public void setParentheses(boolean hasParentheses) {
        preValueChange();
        this.hasParentheses = hasParentheses;

    }

    /**
     * Returns the live ordered list of formal parameters of this lambda expression. Note that all elements must be of
     * the same type, either <ul> <li>all {@link SingleVariableDeclaration} (explicit type), or</li> <li>all
     * {@link VariableDeclarationFragment} (inferred type).</li> </ul>
     *
     * @return the live list of formal parameters of this lambda expression (element type: {@link VariableDeclaration})
     */
    public List parameters() {
        return this.parameters;
    }

    /**
     * Returns the body of this lambda expression.
     *
     * @return the lambda expression body, which can be either a {@link Block} or an {@link Expression}
     */
    public ASTNode getBody() {
        if (this.body == null) {
            this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
        }
        return this.body;
    }

    /**
     * Sets the body of this lambda expression.
     *
     * @param body a block node or an expression node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> <li>body is neither a {@link Block} nor an
     * {@link Expression}</li> </ul>
     */
    public void setBody(ASTNode body) {
        if (!(body instanceof Expression || body instanceof Block)) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, body, BODY_PROPERTY);
        this.body = body;

    }
}
