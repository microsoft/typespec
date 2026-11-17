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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Static or instance initializer AST node type.
 *
 * <pre>
 * Initializer:
 *     [ <b>static</b> ] Block
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class Initializer extends BodyDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    /**
     * The "body" structural property of this node type (child type: {@link Block}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY = new ChildPropertyDescriptor(Block.class, true);

    /**
     * The initializer body; lazily initialized; defaults to an empty block.
     */
    private Block body;

    /**
     * Creates a new AST node for an initializer declaration owned by the given AST. By default, the initializer has no
     * modifiers and an empty block. The javadoc comment is not used for initializers. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Initializer(AST ast) {
        super(ast);
    }

    @Override
    final ChildPropertyDescriptor internalJavadocProperty() {
        return JAVADOC_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalModifiers2Property() {
        return MODIFIERS2_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 28;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getBody());
        }

    }

    /**
     * Returns the body of this initializer declaration.
     *
     * @return the initializer body
     */
    public Block getBody() {
        if (this.body == null) {
            this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
        }
        return this.body;
    }

    /**
     * Sets the body of this initializer declaration.
     *
     * @param body the block node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Block body) {

        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, body, BODY_PROPERTY);
        this.body = body;

    }
}
