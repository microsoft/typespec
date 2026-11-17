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
 * Labeled statement AST node type.
 *
 * <pre>
 * LabeledStatement:
 *    Identifier <b>:</b> Statement
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class LabeledStatement extends Statement {

    /**
     * The "label" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor LABEL_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "body" structural property of this node type (child type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY = new ChildPropertyDescriptor(Statement.class, true);

    /**
     * The label; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private SimpleName labelName;

    /**
     * The body statement; lazily initialized; defaults to an unspecified, but legal, statement.
     */
    private Statement body;

    /**
     * Creates a new AST node for a labeled statement owned by the given AST. By default, the statement has an
     * unspecified (but legal) label and an unspecified (but legal) statement. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    LabeledStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 30;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getLabel());
            acceptChild(visitor, getBody());
        }

    }

    /**
     * Returns the label of this labeled statement.
     *
     * @return the variable name node
     */
    public SimpleName getLabel() {
        if (this.labelName == null) {
            this.labelName = postLazyInit(new SimpleName(this.ast), LABEL_PROPERTY);
        }
        return this.labelName;
    }

    /**
     * Sets the label of this labeled statement.
     *
     * @param label the new label
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setLabel(SimpleName label) {

        ASTNode oldChild = this.labelName;
        preReplaceChild(oldChild, label, LABEL_PROPERTY);
        this.labelName = label;

    }

    /**
     * Returns the body of this labeled statement.
     *
     * @return the body statement node
     */
    public Statement getBody() {
        if (this.body == null) {
            this.body = postLazyInit(new EmptyStatement(this.ast), BODY_PROPERTY);
        }
        return this.body;
    }

    /**
     * Sets the body of this labeled statement. <p> Special note: The Java language does not allow a local variable
     * declaration to appear as the body of a labeled statement (they may only appear within a block). However, the AST
     * will allow a <code>VariableDeclarationStatement</code> as the body of a <code>LabeledStatement</code>. To get
     * something that will compile, be sure to embed the <code>VariableDeclarationStatement</code> inside a
     * <code>Block</code>. </p>
     *
     * @param statement the body statement node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Statement statement) {
        if (statement == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, statement, BODY_PROPERTY);
        this.body = statement;

    }
}
