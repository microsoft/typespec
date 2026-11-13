// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2025 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								Bug 458577 - IClassFile.getWorkingCopy() may lead to NPE in BecomeWorkingCopyOperation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ExplicitConstructorCall;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.RecoveryScanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.RecoveryScannerData;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.BasicCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.util.DOMASTUtil;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util.CodeSnippetParsingUtil;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util.RecordedParsingInformation;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * A Java language parser for creating abstract syntax trees (ASTs). <p> Example: Create basic AST from source string
 *
 * <pre>
 * char[] source = ...;
 * ASTParser parser = ASTParser.newParser();
 * parser.setSource(source, "Example.java");
 * parser.setCompilerOptions(options);
 * CompilationUnit result = (CompilationUnit) parser.createAST();
 * </pre>
 *
 * <p> Once a configured parser instance has been used to create an AST, the settings are automatically reset to their
 * defaults, ready for the parser instance to be reused. </p> <p> There are a number of configurable features: <ul>
 * <li>{@linkplain #setSource(char[], String) Source string} and its file name.</li> <li>Which
 * {@linkplain #setCompilerOptions(Map) compiler options} to use.</li>
 * <li>Whether to parse just {@linkplain #setKind(int) an expression, statements, or body declarations} rather than an
 * entire compilation unit.</li> </ul>
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class ASTParser {

    /**
     * Creates a new object for creating a Java abstract syntax tree (AST) following the specified set of API rules.
     *
     * @return new ASTParser instance
     */
    public static ASTParser newParser() {

        return new ASTParser();
    }

    /**
     * Kind of parse requested. Defaults to an entire compilation unit.
     */
    private int astKind;

    private Map<String, String> compilerOptions;

    /**
     * Source string.
     */
    private char[] rawSource = null;
    private String sourceName = "";

    /**
     * Character-based length limit, or -1 if unlimited. All characters in the source string between <code>offset</code>
     * and <code>offset+length-1</code> inclusive are parsed. Defaults to -1, which means the rest of the source string.
     */
    private int sourceLength = -1;

    ASTParser() {

        DOMASTUtil.checkASTLevel();

        initializeDefaults();
    }

    private void initializeDefaults() {
        this.astKind = 8;
        this.rawSource = null;
        this.sourceLength = -1;
        this.sourceName = "";
        this.compilerOptions = null;
    }

    /**
     * Sets the non-null compiler options for source parsing.
     *
     * @param options the compiler options
     */
    public void setCompilerOptions(Map<String, String> options) {
        this.compilerOptions = new HashMap<>(options);
    }

    /**
     * Sets the kind of constructs to be parsed from the source. Defaults to an entire compilation unit. <p> When the
     * parse is successful the result returned includes the ASTs for the requested source: <ul>
     * <li><code>8</code> (compilation unit): The result node is a {@link CompilationUnit}.</li>
     * <li><code>4</code> (class body declarations): The result node is a {@link TypeDeclaration}
     * whose {@link TypeDeclaration#bodyDeclarations() bodyDeclarations} are the new trees. Other aspects of the type
     * declaration are unspecified.</li> <li><code>2</code> (statements): The result node is a {@link Block
     * Block} whose {@link Block#statements() statements} are the new trees. Other aspects of the block are
     * unspecified.</li> <li><code>1</code> (expression): The result node is a subclass of {@link Expression
     * Expression}. Other aspects of the expression are unspecified.</li> </ul> <p> The resulting AST node is rooted
     * under (possibly contrived) {@link CompilationUnit CompilationUnit} node, to allow the client to retrieve the
     * following pieces of information available there: </p> <ul> <li>Line number map. Line numbers start at 1 and only
     * cover the subrange scanned (<code>source[offset]</code> through <code>source[offset+length-1]</code>).</li>
     * <li>Compiler messages and {@linkplain CompilationUnit#getProblems() detailed problem reports}. Character
     * positions are
     * relative to the start of <code>source</code>; line positions are for the subrange scanned.</li>
     * <li>{@linkplain CompilationUnit#getCommentList() Comment list} for the subrange scanned.</li> </ul> <p> The
     * contrived nodes do not have source positions. Other aspects of the {@link CompilationUnit CompilationUnit} node
     * are unspecified, including the exact arrangement of intervening nodes. </p> <p> Lexical or syntax errors detected
     * while parsing can result in a result node being marked as malformed. In more severe
     * failure cases where the parser is unable to recognize the input, this method returns a {@link CompilationUnit
     * CompilationUnit} node with at least the compiler messages. </p> <p>Each node in the subtree (other than the
     * contrived nodes) carries source range(s) information relating back to positions in the given source (the given
     * source itself is not remembered with the AST). The source range usually begins at the first character of the
     * first token corresponding to the node; leading whitespace and comments are <b>not</b> included. The source range
     * usually extends through the last character of the last token corresponding to the node; trailing whitespace and
     * comments are <b>not</b> included. There are a handful of exceptions (including the various body declarations);
     * the specification for these node type spells out the details. Source ranges nest properly: the source range for a
     * child is always within the source range of its parent, and the source ranges of sibling nodes never overlap. </p>
     * <p> Binding information is only computed when <code>kind</code> is <code>8</code> (compilation unit). </p>
     *
     * @param kind the kind of construct to parse: one of <code>8</code> (compilation unit), <code>4</code> (class body
     * declarations), <code>1</code> (expression), or <code>2</code> (statements)
     */
    public void setKind(int kind) {
        if ((kind != 8) && (kind != 4) && (kind != 1) && (kind != 2)) {
            throw new IllegalArgumentException();
        }
        this.astKind = kind;
    }

    /**
     * Sets source and its file name without creating a Java model or project.
     *
     * @param source the source to parse
     * @param name the file name, including module-info.java for module declarations
     */
    public void setSource(char[] source, String name) {
        this.rawSource = source;
        this.sourceName = java.util.Objects.requireNonNull(name);
    }

    /**
     * Parses the configured source and resets the parser for reuse.
     *
     * @return the compilation unit or Java snippet AST
     */
    public ASTNode createAST() {
        try {
            if (this.rawSource == null) {
                throw new IllegalStateException("source not specified");
            }
            if (this.compilerOptions == null) {
                throw new IllegalStateException("compiler options not specified");
            }
            return internalCreateAST();
        } finally {
            initializeDefaults();
        }
    }

    private static <K, V> Map<K, V> safeUnmodifiableMap(Map<? extends K, ? extends V> m) {
        return m == null ? null : Collections.unmodifiableMap(m);
    }

    private ASTNode internalCreateAST() {
        switch (this.astKind) {
            case 4:
            case 1:
            case 2:
                if (this.sourceLength > this.rawSource.length) {
                    throw new IllegalStateException();
                }
                return internalCreateASTForKind();

            case 8:
                BasicCompilationUnit sourceUnit = new BasicCompilationUnit(this.rawSource, this.sourceName);
                Map<String, String> options = safeUnmodifiableMap(this.compilerOptions);
                var parsed = CompilationUnitResolver.parse(sourceUnit, options);
                return CompilationUnitResolver.convert(parsed, this.rawSource, options);

            default:
                throw new IllegalStateException("unsupported parse kind: " + this.astKind);
        }
    }

    /**
     * Parses the given source between the bounds specified by the given offset (inclusive) and the given length and
     * creates and returns a corresponding abstract syntax tree. <p> When the parse is successful the result returned
     * includes the ASTs for the requested source: <ul> <li><code>4</code> (class body declarations): The result node
     * is a {@link TypeDeclaration TypeDeclaration} whose
     * {@link TypeDeclaration#bodyDeclarations() bodyDeclarations} are the new trees. Other aspects of the type
     * declaration are unspecified.</li> <li><code>2</code> (statements): The result node is a {@link Block
     * Block} whose {@link Block#statements() statements} are the new trees. Other aspects of the block are
     * unspecified.</li> <li><code>1</code> (expression): The result node is a subclass of {@link Expression
     * Expression}. Other aspects of the expression are unspecified.</li> </ul> The resulting AST node is rooted under
     * an contrived {@link CompilationUnit CompilationUnit} node, to allow the client to retrieve the following pieces
     * of information available there: <ul> <li>Line number map. Line
     * numbers start at 1 and only cover the subrange scanned (<code>source[offset]</code> through
     * <code>source[offset+length-1]</code>).</li> <li>Compiler messages and
     * {@linkplain CompilationUnit#getProblems() detailed problem reports}. Character positions are relative to the
     * start of <code>source</code>; line positions are for the subrange scanned.</li>
     * <li>{@linkplain CompilationUnit#getCommentList() Comment list} for the subrange scanned.</li> </ul> <p> The
     * contrived nodes do not have source positions. Other aspects of the {@link CompilationUnit CompilationUnit} node
     * are unspecified, including the exact arrangment of intervening nodes. </p> <p> Lexical or syntax errors detected
     * while parsing can result in a result node being marked as malformed. In more severe
     * failure cases where the parser is unable to recognize the input, this method returns a {@link CompilationUnit
     * CompilationUnit} node with at least the compiler messages. </p> <p>Each node in the subtree (other than the
     * contrived nodes) carries source range(s) information relating back to positions in the given source (the given
     * source itself is not remembered with the AST). The source range usually begins at the first character of the
     * first token corresponding to the node; leading whitespace and comments are <b>not</b> included. The source range
     * usually extends through the last character of the last token corresponding to the node; trailing whitespace and
     * comments are <b>not</b> included. There are a handful of exceptions (including the various body declarations);
     * the specification for these node type spells out the details. Source ranges nest properly: the source range for a
     * child is always within the source range of its parent, and the source ranges of sibling nodes never overlap. </p>
     * <p> This method does not compute binding information. </p>
     *
     * @return an AST node whose type depends on the kind of parse requested, with a fallback to a
     * <code>CompilationUnit</code> in the case of severe parsing errors
     * @see ASTNode#getStartPosition()
     * @see ASTNode#getLength()
     */
    private ASTNode internalCreateASTForKind() {
        final ASTConverter converter = new ASTConverter(this.compilerOptions);
        converter.compilationUnitSource = this.rawSource;
        converter.compilationUnitSourceLength = this.rawSource.length;
        converter.scanner.setSource(this.rawSource);

        AST ast = AST.newAST(
            "enabled".equals(this.compilerOptions.get("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures")));
        ast.setDefaultNodeFlag(2);

        ast.scanner.previewEnabled
            = "enabled".equals(this.compilerOptions.get("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures"));
        converter.setAST(ast);
        CodeSnippetParsingUtil codeSnippetParsingUtil = new CodeSnippetParsingUtil();
        CompilationUnit compilationUnit = ast.newCompilationUnit();
        if (this.sourceLength == -1) {
            this.sourceLength = this.rawSource.length;
        }
        switch (this.astKind) {
            case 2:
                ConstructorDeclaration constructorDeclaration
                    = codeSnippetParsingUtil.parseStatements(this.rawSource, this.sourceLength, this.compilerOptions);
                RecoveryScannerData data = constructorDeclaration.compilationResult.recoveryScannerData;
                if (data != null) {
                    Scanner scanner = converter.scanner;
                    converter.scanner = new RecoveryScanner(scanner, data.removeUnused());
                    converter.docParser.scanner = converter.scanner;
                    converter.scanner.setSource(scanner.source);

                    java.util.Objects.requireNonNull(compilationUnit);
                }
                RecordedParsingInformation recordedParsingInformation
                    = codeSnippetParsingUtil.recordedParsingInformation;
                int[][] comments = recordedParsingInformation.commentPositions;
                if (comments != null) {
                    converter.buildCommentsTable(compilationUnit, comments);
                }
                compilationUnit.setLineEndTable(recordedParsingInformation.lineEnds);
                Block block = ast.newBlock();
                block.setSourceRange(0, this.sourceLength);
                ExplicitConstructorCall constructorCall = constructorDeclaration.constructorCall;
                if (constructorCall != null && constructorCall.accessMode != 1) {
                    block.statements().add(converter.convert(constructorCall));
                }
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Statement[] statements
                    = constructorDeclaration.statements;
                if (statements != null) {
                    int statementsLength = statements.length;
                    for (int i = 0; i < statementsLength; i++) {
                        if (statements[i] instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.LocalDeclaration) {
                            converter.checkAndAddMultipleLocalDeclaration(statements, i, block.statements());
                        } else {
                            Statement statement = converter.convert(statements[i]);
                            if (statement != null) {
                                block.statements().add(statement);
                            }
                        }
                    }
                }
                rootNodeToCompilationUnit(ast, compilationUnit, block, recordedParsingInformation, data);
                ast.setDefaultNodeFlag(0);
                return block;

            case 1:
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Expression expression
                    = codeSnippetParsingUtil.parseExpression(this.rawSource, this.sourceLength, this.compilerOptions);
                recordedParsingInformation = codeSnippetParsingUtil.recordedParsingInformation;
                comments = recordedParsingInformation.commentPositions;
                if (comments != null) {
                    converter.buildCommentsTable(compilationUnit, comments);
                }
                compilationUnit.setLineEndTable(recordedParsingInformation.lineEnds);
                if (expression != null) {
                    Expression expression2 = converter.convert(expression);
                    rootNodeToCompilationUnit(expression2.getAST(), compilationUnit, expression2,
                        codeSnippetParsingUtil.recordedParsingInformation, null);
                    ast.setDefaultNodeFlag(0);
                    return expression2;
                } else {
                    IProblem[] problems = recordedParsingInformation.problems;
                    if (problems != null) {
                        compilationUnit.setProblems(problems);
                    }
                    ast.setDefaultNodeFlag(0);
                    return compilationUnit;
                }
            case 4:
                final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode[] nodes
                    = codeSnippetParsingUtil.parseClassBodyDeclarations(this.rawSource, this.sourceLength,
                        this.compilerOptions);
                recordedParsingInformation = codeSnippetParsingUtil.recordedParsingInformation;
                comments = recordedParsingInformation.commentPositions;
                if (comments != null) {
                    converter.buildCommentsTable(compilationUnit, comments);
                }
                compilationUnit.setLineEndTable(recordedParsingInformation.lineEnds);
                if (nodes != null) {
                    // source has no syntax error or the statement recovery is enabled
                    TypeDeclaration typeDeclaration = converter.convert(nodes);
                    typeDeclaration.setSourceRange(0, this.sourceLength);
                    rootNodeToCompilationUnit(typeDeclaration.getAST(), compilationUnit, typeDeclaration,
                        codeSnippetParsingUtil.recordedParsingInformation, null);
                    ast.setDefaultNodeFlag(0);
                    return typeDeclaration;
                } else {
                    // source has syntax error and the statement recovery is disabled
                    IProblem[] problems = recordedParsingInformation.problems;
                    if (problems != null) {
                        compilationUnit.setProblems(problems);
                    }
                    ast.setDefaultNodeFlag(0);
                    return compilationUnit;
                }
        }
        throw new IllegalStateException();
    }

    private void propagateErrors(ASTNode astNode, IProblem[] problems, RecoveryScannerData data) {
        astNode.accept(new ASTSyntaxErrorPropagator(problems));
        if (data != null) {
            astNode.accept(new ASTRecoveryPropagator(problems, data));
        }
    }

    private void rootNodeToCompilationUnit(AST ast, CompilationUnit compilationUnit, ASTNode node,
        RecordedParsingInformation recordedParsingInformation, RecoveryScannerData data) {
        final int problemsCount = recordedParsingInformation.problemsCount;
        switch (node.getNodeType()) {
            case 8: {
                Block block = (Block) node;
                if (problemsCount != 0) {
                    // propagate and record problems
                    final IProblem[] problems = recordedParsingInformation.problems;
                    propagateErrors(block, problems, data);
                    compilationUnit.setProblems(problems);
                }
                TypeDeclaration typeDeclaration = ast.newTypeDeclaration();
                Initializer initializer = ast.newInitializer();
                initializer.setBody(block);
                typeDeclaration.bodyDeclarations().add(initializer);
                compilationUnit.types().add(typeDeclaration);
            }
                break;

            case 55: {
                TypeDeclaration typeDeclaration = (TypeDeclaration) node;
                if (problemsCount != 0) {
                    // propagate and record problems
                    final IProblem[] problems = recordedParsingInformation.problems;
                    propagateErrors(typeDeclaration, problems, data);
                    compilationUnit.setProblems(problems);
                }
                compilationUnit.types().add(typeDeclaration);
            }
                break;

            default:
                if (node instanceof Expression expression) {
                    if (problemsCount != 0) {
                        // propagate and record problems
                        final IProblem[] problems = recordedParsingInformation.problems;
                        propagateErrors(expression, problems, data);
                        compilationUnit.setProblems(problems);
                    }
                    ExpressionStatement expressionStatement = ast.newExpressionStatement(expression);
                    Block block = ast.newBlock();
                    block.statements().add(expressionStatement);
                    Initializer initializer = ast.newInitializer();
                    initializer.setBody(block);
                    TypeDeclaration typeDeclaration = ast.newTypeDeclaration();
                    typeDeclaration.bodyDeclarations().add(initializer);
                    compilationUnit.types().add(typeDeclaration);
                }
        }
    }
}
