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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ModuleDeclaration extends ASTNode {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY
        = new ChildPropertyDescriptor(ModuleDeclaration.class, "javadoc", Javadoc.class, false); //$NON-NLS-1$

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = new ChildListPropertyDescriptor(ModuleDeclaration.class, "annotations", Annotation.class, false); //$NON-NLS-1$

    /**
     * The "open" structural property of this node type (type: {@link Boolean}).
     */
    public static final SimplePropertyDescriptor OPEN_PROPERTY
        = new SimplePropertyDescriptor(ModuleDeclaration.class, "open", boolean.class); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(ModuleDeclaration.class, "name", Name.class, false); //$NON-NLS-1$

    /**
     * The "moduleDirectives" structural property of this node type (element type: {@link ModuleDirective}).
     */
    public static final ChildListPropertyDescriptor MODULE_DIRECTIVES_PROPERTY
        = new ChildListPropertyDescriptor(ModuleDeclaration.class, "moduleDirectives", ModuleDirective.class, false); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(6);
        createPropertyList(ModuleDeclaration.class, properyList);
        addProperty(JAVADOC_PROPERTY, properyList);
        addProperty(ANNOTATIONS_PROPERTY, properyList);
        addProperty(OPEN_PROPERTY, properyList);
        addProperty(NAME_PROPERTY, properyList);
        addProperty(MODULE_DIRECTIVES_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The annotations (element type: {@link Annotation}). Defaults to an empty list.
     */
    private final ASTNode.NodeList annotations = new ASTNode.NodeList(ANNOTATIONS_PROPERTY);

    /**
     * open versus normal; defaults to normal module.
     */
    private boolean isOpen = false;

    /**
     * The referenced module name; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private volatile Name name;

    /**
     * The list of statements (element type: {@link ModuleDirective}). Defaults to an empty list.
     */
    private final ASTNode.NodeList moduleStatements = new ASTNode.NodeList(MODULE_DIRECTIVES_PROPERTY);

    ModuleDeclaration(AST ast) {
        super(ast);
        unsupportedBelow9();
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
            acceptChild(visitor,
                ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.Javadoc) (null)));
            acceptChildren(visitor, this.annotations);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.moduleStatements);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the doc comment node.
     *
     * @return the doc comment node, or <code>null</code> if none
     */
    public Javadoc getJavadoc() {
        return null;
    }

    /**
     * Returns the live ordered list of annotations of this declaration.
     *
     * @return the live list of annotations (element type: {@link Annotation})
     */
    public List annotations() {
        return this.annotations;
    }

    /**
     * Returns whether this module declaration is open or not.
     *
     * @return <code>true</code> if this is open, else <code>false</code>
     */
    public boolean isOpen() {
        return this.isOpen;
    }

    /**
     * Sets whether this module declaration is open or not.
     *
     * @param isOpen <code>true</code> if this is an open module, and <code>false</code> if not
     */
    public void setOpen(boolean isOpen) {
        preValueChange();
        this.isOpen = isOpen;

    }

    /**
     * Returns the name of this module declaration.
     *
     * @return the module name
     */
    public Name getName() {
        if (this.name == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.name == null) {
                    this.name = postLazyInit(
                        this.ast.newQualifiedName(new SimpleName(this.ast), new SimpleName(this.ast)), NAME_PROPERTY);
                }
            }
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
        if (name == null) {
            throw new IllegalArgumentException();
        }
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
    public List moduleStatements() {
        return this.moduleStatements;
    }

}
