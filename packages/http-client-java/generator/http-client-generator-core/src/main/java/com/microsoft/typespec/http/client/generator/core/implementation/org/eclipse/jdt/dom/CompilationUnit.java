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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Java compilation unit AST node type. This is the type of the root of an AST. In JLS9 and later, this node can also
 * contain a ModuleDeclaration (with a completely different grammar). <p> The source range for this type of node is
 * ordinarily the entire source file, including leading and trailing whitespace and comments. </p>
 *
 * <pre>
 * CompilationUnit:
 *     OrdinaryCompilationUnit
 *     ModularCompilationUnit
 *
 * OrdinaryCompilationUnit:
 *     [ PackageDeclaration ]
 *         { ImportDeclaration }
 *         { TypeDeclaration | EnumDeclaration | AnnotationTypeDeclaration | <b>;</b> }
 *
 * ModularCompilationUnit:
 *     {ImportDeclaration}
 *         ModuleDeclaration
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @noextend This class is not intended to be subclassed by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class CompilationUnit extends ASTNode {

    /**
     * Canonical empty list of problems.
     */
    private static final IProblem[] EMPTY_PROBLEMS = new IProblem[0];

    /**
     * The "imports" structural property of this node type (element type: {@link ImportDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor IMPORTS_PROPERTY
        = new ChildListPropertyDescriptor(ImportDeclaration.class, false);

    /**
     * The "package" structural property of this node type (child type: {@link PackageDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor PACKAGE_PROPERTY
        = new ChildPropertyDescriptor(PackageDeclaration.class, false);

    /**
     * The "module" structural property of this node type (child type: {@link ModuleDeclaration}) (added in JLS9 API).
     *
     * @since 3.14
     */
    public static final ChildPropertyDescriptor MODULE_PROPERTY
        = new ChildPropertyDescriptor(ModuleDeclaration.class, false);

    /**
     * The "types" structural property of this node type (element type: {@link AbstractTypeDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor TYPES_PROPERTY
        = new ChildListPropertyDescriptor(AbstractTypeDeclaration.class, true);

    /**
     * The list of import declarations in textual order order; initially none (elementType:
     * <code>ImportDeclaration</code>).
     */
    private final ASTNode.NodeList imports = new ASTNode.NodeList(IMPORTS_PROPERTY);

    /**
     * The comment list (element type: {@link Comment}, or <code>null</code> if none; initially <code>null</code>.
     *
     * @since 3.0
     */
    private List optionalCommentList = null;

    /**
     * The package declaration, or <code>null</code> if none; initially <code>null</code>.
     */
    private PackageDeclaration optionalPackageDeclaration = null;

    /**
     * The module declaration, or <code>null</code> if none; initially <code>null</code>.
     */
    private ModuleDeclaration module = null;
    /**
     * Problems reported by the compiler during parsing or name resolution.
     */
    private IProblem[] problems = EMPTY_PROBLEMS;

    /**
     * The list of type declarations in textual order order; initially none (elementType:
     * <code>AbstractTypeDeclaration</code>)
     */
    private final ASTNode.NodeList types = new ASTNode.NodeList(TYPES_PROPERTY);

    /**
     * Creates a new AST node for a compilation owned by the given AST. The compilation unit initially has no package
     * declaration, no import declarations, and no type declarations. <p> N.B. This constructor is package-private; all
     * subclasses must be declared in the same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    CompilationUnit(AST ast) {
        super(ast);
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getModule());
            acceptChild(visitor, getPackage());
            acceptChildren(visitor, this.imports);
            acceptChildren(visitor, this.types);
        }

    }

    /**
     * Returns a list of the comments encountered while parsing this compilation unit. <p> Since the Java language
     * allows comments to appear most anywhere in the source text, it is problematic to locate comments in relation to
     * the structure of an AST. The one exception is doc comments which, by convention, immediately precede type, field,
     * and method declarations; these comments are located in the AST by {@link BodyDeclaration#getJavadoc
     * BodyDeclaration.getJavadoc}. Other comments do not show up in the AST. The table of comments is provided for
     * clients that need to find the source ranges of all comments in the original source string. It includes entries
     * for comments of all kinds (line, block, and doc), arranged in order of increasing source position. </p> <p> Note
     * on comment parenting: The {@link ASTNode#getParent() getParent()} of a doc comment associated with a body
     * declaration is the body declaration node; for these comment nodes {@link ASTNode#getRoot() getRoot()} will return
     * the compilation unit (assuming an unmodified AST) reflecting the fact that these nodes are property located in
     * the AST for the compilation unit. However, for other comment nodes, {@link ASTNode#getParent() getParent()} will
     * return <code>null</code>, and {@link ASTNode#getRoot() getRoot()} will return the comment node itself, indicating
     * that these comment nodes are not directly connected to the AST for the compilation unit. The
     * Comment.getAlternateRoot method provides a way to navigate from a comment to its
     * compilation unit. </p> <p> A note on visitors: The only comment nodes that will be visited when visiting a
     * compilation unit are the doc comments parented by body declarations. To visit all comments in normal reading
     * order, iterate over the comment table and call {@link ASTNode#accept(ASTVisitor) accept} on each element. </p>
     * <p> Clients cannot modify the resulting list. </p>
     *
     * @return an unmodifiable list of comments in increasing order of source start position (element type:
     * {@link Comment}, or <code>null</code> if comment information for this compilation unit is not available
     * @see ASTParser
     * @since 3.0
     */
    public List getCommentList() {
        return this.optionalCommentList;
    }

    @Override
    final int getNodeType0() {
        return 15;
    }

    /**
     * Returns the node for the module declaration of this compilation unit, or <code>null</code> if this compilation
     * unit is not a module info.
     *
     * @return the module declaration node, or <code>null</code> if none
     * @since 3.14
     */
    public ModuleDeclaration getModule() {

        return this.module;
    }

    /**
     * Returns the node for the package declaration of this compilation unit, or <code>null</code> if this compilation
     * unit is in the default package.
     *
     * @return the package declaration node, or <code>null</code> if none
     */
    public PackageDeclaration getPackage() {
        return this.optionalPackageDeclaration;
    }

    /**
     * Returns the list of detailed problem reports noted by the compiler during the parsing or the type checking of
     * this compilation unit. This list might be a subset of errors detected and reported by a Java compiler. <p> Simple
     * clients that do little more than log the messages or display them to the user should probably call
     * <code>getMessages</code> instead. </p>
     *
     * @return the list of detailed problem objects, possibly empty
     * @see ASTParser
     * @since 2.1
     */
    public IProblem[] getProblems() {
        return this.problems;
    }

    /**
     * Returns the live list of nodes for the import declarations of this compilation unit, in order of appearance.
     *
     * @return the live list of import declaration nodes (elementType: {@link ImportDeclaration})
     */
    public List imports() {
        return this.imports;
    }

    /**
     * Sets the list of the comments encountered while parsing this compilation unit.
     *
     * @param commentTable a list of comments in increasing order of source start position, or <code>null</code> if
     * comment information for this compilation unit is not available
     * @exception IllegalArgumentException if the comment table is not in increasing order of source position
     * @see #getCommentList()
     * @see ASTParser
     * @since 3.0
     */
    void setCommentTable(Comment[] commentTable) {
        // double check table to ensure that all comments have
        // source positions and are in strictly increasing order
        if (commentTable == null) {
            this.optionalCommentList = null;

        } else {
            int nextAvailablePosition = 0;
            for (Comment comment : commentTable) {
                if (comment == null) {
                    throw new IllegalArgumentException();
                }
                int start = comment.getStartPosition();
                int length = comment.getLength();
                if (start < 0 || length < 0 || start < nextAvailablePosition) {
                    throw new IllegalArgumentException();
                }
                nextAvailablePosition = comment.getStartPosition() + comment.getLength();
            }

            List commentList = Arrays.asList(commentTable);
            // protect the list from further modification
            this.optionalCommentList = Collections.unmodifiableList(commentList);
        }
    }

    /**
     * Sets the line end table for this compilation unit. If <code>lineEndTable[i] == p</code> then line number
     * <code>i+1</code> ends at character position <code>p</code>. Except for the last line, the positions are that of
     * (the last character of) the line delimiter. For example, the source string <code>A\nB\nC</code> has line end
     * table {1, 3, 4}.
     *
     * @param lineEndTable the line end table
     */
    void setLineEndTable(int[] lineEndTable) {
        if (lineEndTable == null) {
            throw new NullPointerException();
        }
        // alternate root is *not* considered a structural property
        // but we protect them nevertheless
        checkModifiable();
    }

    /**
     * Sets or clears the module declaration of this compilation unit node to the given module declaration node.
     *
     * @param module the new module declaration node, or <code>null</code> if this compilation unit does not have a
     * module
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 3.14
     */
    public void setModule(ModuleDeclaration module) {

        ASTNode oldChild = this.module;
        preReplaceChild(oldChild, module, MODULE_PROPERTY);
        this.module = module;

    }

    /**
     * Sets or clears the package declaration of this compilation unit node to the given package declaration node.
     *
     * @param pkgDecl the new package declaration node, or <code>null</code> if this compilation unit does not have a
     * package declaration (that is in the default package)
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setPackage(PackageDeclaration pkgDecl) {
        ASTNode oldChild = this.optionalPackageDeclaration;
        preReplaceChild(oldChild, pkgDecl, PACKAGE_PROPERTY);
        this.optionalPackageDeclaration = pkgDecl;

    }

    /**
     * Sets the array of problems reported by the compiler during the parsing or name resolution of this compilation
     * unit.
     *
     * @param problems the list of problems
     */
    void setProblems(IProblem[] problems) {
        if (problems == null) {
            throw new IllegalArgumentException();
        }
        this.problems = problems;
    }

    /**
     * Returns the live list of nodes for the top-level type declarations of this compilation unit, in order of
     * appearance. <p> Note that in JLS3, the types may include both enum declarations and annotation type declarations
     * introduced in J2SE 5. For JLS2, the elements are always <code>TypeDeclaration</code>. </p>
     *
     * @return the live list of top-level type declaration nodes (element type: {@link AbstractTypeDeclaration})
     */
    public List types() {
        return this.types;
    }
}
