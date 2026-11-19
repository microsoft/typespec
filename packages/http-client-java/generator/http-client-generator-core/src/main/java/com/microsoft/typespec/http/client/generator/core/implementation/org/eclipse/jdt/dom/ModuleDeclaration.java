// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2019 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Module declaration AST node type representing the module descriptor file (added in JLS9 API).
 *
 * <pre>
 * ModuleDeclaration:
 *  [ Javadoc ] { Annotation } [ <b>open</b> ] <b>module</b> Name <b>{</b>
 *        { RequiresDirective | ExportsDirective | OpensDirective | UsesDirective | ProvidesDirective }
 *  <b>}</b>
 * </pre>
 *
 * @since 3.14
 *
 * @noextend This class is not intended to be subclassed by clients.
 */
public class ModuleDeclaration extends ASTNode {

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(Annotation.class, false);

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The "moduleDirectives" structural property of this node type (element type: {@link ModuleDirective}).
     */
    public static final ChildListPropertyDescriptor MODULE_DIRECTIVES_PROPERTY
        = new ChildListPropertyDescriptor(ModuleDirective.class, false);

    /**
     * The annotations (element type: {@link Annotation}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Annotation> annotations = new ASTNode.NodeList<>(ANNOTATIONS_PROPERTY);

    /**
     * The referenced module name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private Name name;

    /**
     * The list of statements (element type: {@link ModuleDirective}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<ModuleDirective> moduleStatements
        = new ASTNode.NodeList<>(MODULE_DIRECTIVES_PROPERTY);

    ModuleDeclaration(AST ast) {
        super(ast);

    }

    @Override
    int getNodeType0() {
        return 93;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, null);
            acceptChildren(visitor, this.annotations);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.moduleStatements);
        }

    }

    /**
     * Returns the live ordered list of annotations of this declaration.
     *
     * @return the live list of annotations (element type: {@link Annotation})
     */
    public List<Annotation> annotations() {
        return this.annotations;
    }

    /**
     * Returns the name of this module declaration.
     *
     * @return the module name
     */
    public Name getName() {
        if (this.name == null) {
            this.name = postLazyInit(this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)),
                NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the module name in to the given name.
     *
     * @param name the new module name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }

    /**
     * Returns the live list of statements in this module. Adding and removing nodes from this list affects this node
     * dynamically. All nodes in this list must be <code>ModuleDirective</code>s; attempts to add any other type of node
     * will trigger an exception.
     *
     * @return the live list of statements in this module declaration (element type: {@link ModuleDirective})
     */
    public List<ModuleDirective> moduleStatements() {
        return this.moduleStatements;
    }

}
