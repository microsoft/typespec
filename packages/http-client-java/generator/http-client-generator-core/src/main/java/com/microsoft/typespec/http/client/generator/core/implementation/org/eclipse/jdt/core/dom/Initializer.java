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
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory(Initializer.class);

    /**
     * The "modifiers" structural property of this node type (type: {@link Integer}) (JLS2 API only).
     *
     * @since 3.0
     * @deprecated In the JLS3 API, this property is replaced by {@link #MODIFIERS2_PROPERTY}.
     */
    public static final SimplePropertyDescriptor MODIFIERS_PROPERTY
        = internalModifiersPropertyFactory(Initializer.class);

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = internalModifiers2PropertyFactory(Initializer.class);

    /**
     * The "body" structural property of this node type (child type: {@link Block}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY
        = new ChildPropertyDescriptor(Initializer.class, "body", Block.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(4);
        createPropertyList(Initializer.class, properyList);
        addProperty(JAVADOC_PROPERTY, properyList);
        addProperty(MODIFIERS_PROPERTY, properyList);
        addProperty(BODY_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(4);
        createPropertyList(Initializer.class, properyList);
        addProperty(JAVADOC_PROPERTY, properyList);
        addProperty(MODIFIERS2_PROPERTY, properyList);
        addProperty(BODY_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The initializer body; lazily initialized; defaults to an empty block.
     */
    private volatile Block body;

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
    final SimplePropertyDescriptor internalModifiersProperty() {
        return MODIFIERS_PROPERTY;
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
            if (this.ast.apiLevel >= 3) {
                acceptChildren(visitor, this.modifiers);
            }
            acceptChild(visitor, getBody());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the body of this initializer declaration.
     *
     * @return the initializer body
     */
    public Block getBody() {
        if (this.body == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.body == null) {
                    this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
                }
            }
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
        if (body == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, body, BODY_PROPERTY);
        this.body = body;

    }
}
