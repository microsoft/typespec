// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] IndexOutOfBoundsException in TokenManager - https://bugs.eclipse.org/462945
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     IBM Corporation - DOM AST changes for JEP 354
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.*;
import java.util.ArrayList;
import java.util.List;

public class LineBreaksPreparator extends ASTVisitor {
    final private TokenManager tm;

    public LineBreaksPreparator(TokenManager tokenManager) {
        this.tm = tokenManager;

    }

    @Override
    public boolean preVisit2(ASTNode node) {
        return (node.getFlags() & 1) == 0;
    }

    @Override
    public boolean visit(CompilationUnit node) {
        List<ImportDeclaration> imports = node.imports();
        if (!imports.isEmpty()
            && this.tm.firstIndexIn(imports.get(0),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                > 0)
            putBlankLinesBefore(imports.get(0), 1);

        for (int i = 1; i < imports.size(); i++) {
            int from = this.tm.lastIndexIn(imports.get(i - 1),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
            int to = this.tm.firstIndexIn(imports.get(i),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
            for (int j = from; j < to; j++) {
                Token token1 = this.tm.get(j);
                Token token2 = this.tm.get(j + 1);
                if (this.tm.countLineBreaksBetween(token1, token2) > 1)
                    putBlankLinesAfter(token1, 1);
            }
        }

        List<AbstractTypeDeclaration> types = node.types();
        if (!types.isEmpty()) {
            if (!imports.isEmpty())
                putBlankLinesBefore(types.get(0), 1);
            for (int i = 1; i < types.size(); i++)
                putBlankLinesBefore(types.get(i), 1);
        }
        return true;
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        if (node.getJavadoc() == null) {
            putBlankLinesBefore(node, 0);
        } else {
            putBlankLinesAfter(this.tm.lastTokenIn(node.getJavadoc(),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
                0);
        }

        handleAnnotations(node.annotations(), true);
        putBlankLinesAfter(this.tm.lastTokenIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
            1);
        return true;
    }

    @Override
    public boolean visit(ImportDeclaration node) {
        breakLineBefore(node);
        return true;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        handleBodyDeclarations(node.bodyDeclarations());

        if (this.tm.isFake(node))
            return true;

        breakLineBefore(node);
        handleAnnotations(node.modifiers(), true);
        handleBracedCode(node, node.getName());
        return true;
    }

    private void handleBodyDeclarations(List<BodyDeclaration> bodyDeclarations) {
        BodyDeclaration previous = null;
        for (BodyDeclaration bodyDeclaration : bodyDeclarations) {
            int blankLines = 0;
            if (previous != null
                && (!sameChunk(previous, bodyDeclaration)
                    || bodyDeclaration instanceof AbstractTypeDeclaration
                    || bodyDeclaration instanceof MethodDeclaration
                    || bodyDeclaration instanceof AnnotationTypeMemberDeclaration)) {
                blankLines = 1;
            }
            putBlankLinesBefore(bodyDeclaration, blankLines);
            previous = bodyDeclaration;
        }
        if (previous != null) {
            ASTNode parent = previous.getParent();
            if (!(parent instanceof TypeDeclaration && this.tm.isFake((TypeDeclaration) parent))) {
                Token lastToken = this.tm.lastTokenIn(parent,
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
                putBlankLinesBefore(lastToken, 0);
            }
        }
    }

    private boolean sameChunk(BodyDeclaration bd1, BodyDeclaration bd2) {
        if (bd1.getClass().equals(bd2.getClass()))
            return true;
        if (bd1 instanceof AbstractTypeDeclaration && bd2 instanceof AbstractTypeDeclaration)
            return true;
        return (bd1 instanceof FieldDeclaration || bd1 instanceof Initializer)
            && (bd2 instanceof FieldDeclaration || bd2 instanceof Initializer); // special case: initializers are often
                                                                                // related to fields, don't separate
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        handleBracedCode(node, node.getName());

        List<BodyDeclaration> declarations = node.bodyDeclarations();
        List<EnumConstantDeclaration> enumConstants = node.enumConstants();
        if (!declarations.isEmpty()) {
            if (!enumConstants.isEmpty()) {
                declarations = new ArrayList<>(declarations);
                declarations.add(0, enumConstants.get(0));
            }
            handleBodyDeclarations(declarations);
        }

        for (int i = 0; i < enumConstants.size(); i++) {
            EnumConstantDeclaration declaration = enumConstants.get(i);
            if (declaration.getJavadoc() != null)
                this.tm.firstTokenIn(declaration.getJavadoc(),
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                    .breakBefore();
            if (declaration.getAnonymousClassDeclaration() != null && i < enumConstants.size() - 1)
                this.tm.firstTokenAfter(declaration, TokenNameCOMMA).breakAfter();
        }

        // put breaks after semicolons
        int index = enumConstants.isEmpty()
            ? this.tm.firstIndexAfter(node.getName(), TokenNameLBRACE) + 1
            : this.tm.firstIndexAfter(enumConstants.get(enumConstants.size() - 1),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        for (;; index++) {
            Token token = this.tm.get(index);
            if (token.isComment())
                continue;
            if (token.tokenType == TokenNameSEMICOLON)
                token.breakAfter();
            else
                break;
        }
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        handleBracedCode(node, node.getName());

        handleBodyDeclarations(node.bodyDeclarations());
        boolean hasModifierKeyword = false;
        for (IExtendedModifier modifier : node.modifiers())
            hasModifierKeyword |= modifier.isModifier();
        if (!hasModifierKeyword)
            this.tm.firstTokenBefore(node.getName(), TokenNameAT).breakBefore();
        return true;
    }

    @Override
    public boolean visit(AnonymousClassDeclaration node) {
        handleBracedCode(node, null);
        handleBodyDeclarations(node.bodyDeclarations());
        return true;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        if (node.getBody() == null)
            return true;

        handleBracedCode(node.getBody(), null);

        return true;
    }

    @Override
    public boolean visit(Block node) {
        List<Statement> statements = node.statements();
        for (Statement statement : statements) {
            if (!(statement instanceof EmptyStatement))
                breakLineBefore(statement);
        }
        ASTNode parent = node.getParent();
        if (parent.getLength() == 0)
            return true; // this is a fake block created by parsing in statements mode
        if (parent instanceof MethodDeclaration)
            return true; // braces have been handled in #visit(MethodDeclaration)

        handleBracedCode(node, null);

        if (parent instanceof Block) {
            blankLinesAroundBlock(node, ((Block) parent).statements());
        } else if (parent instanceof Statement && parent.getParent() instanceof Block) {
            blankLinesAroundBlock(parent, ((Block) parent.getParent()).statements());
        }

        return true;
    }

    private void blankLinesAroundBlock(ASTNode blockStatement, List<? extends ASTNode> siblings) {
        putBlankLinesBefore(blockStatement, 0);
        int blockIndex = siblings.indexOf(blockStatement);
        if (blockIndex + 1 < siblings.size() && siblings.get(blockIndex + 1) instanceof EmptyStatement)
            return;
        putBlankLinesAfter(this.tm.lastTokenIn(blockStatement,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
            0);
    }

    @Override
    public boolean visit(SwitchStatement node) {
        handleBracedCode(node, node.getExpression());

        List<Statement> statements = node.statements();
        doSwitchStatementsIndentation(node, statements);
        doSwitchStatementsLineBreaks(statements);

        if (node.getParent() instanceof Block)
            blankLinesAroundBlock(node, ((Block) node.getParent()).statements());

        return true;
    }

    private void doSwitchStatementsIndentation(ASTNode switchNode, List<Statement> statements) {
        int nonBreakStatementEnd = -1;
        for (Statement statement : statements) {
            boolean isBreaking = isSwitchBreakingStatement(statement);
            if (statement instanceof SwitchCase) {
                if (nonBreakStatementEnd >= 0) {
                    // indent only comments between previous and current statement
                    this.tm.get(nonBreakStatementEnd + 1).indent();
                    this.tm.firstTokenIn(statement,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                        .unindent();
                }
            } else if (!(statement instanceof BreakStatement || statement instanceof Block)) {
                indent(statement);
            }
            nonBreakStatementEnd = isBreaking
                ? -1
                : this.tm.lastIndexIn(statement,
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        }
        if (nonBreakStatementEnd >= 0) {
            // indent comments between last statement and closing brace
            this.tm.get(nonBreakStatementEnd + 1).indent();
            this.tm.lastTokenIn(switchNode, TokenNameRBRACE).unindent();
        }
        for (Statement statement : statements) {
            if (statement instanceof BreakStatement)
                indent(statement);
        }
    }

    private void doSwitchStatementsLineBreaks(List<Statement> statements) {
        Statement previous = null;
        for (Statement statement : statements) {
            boolean skip = statement instanceof Block // will add break in visit(Block) if necessary
                || (statement instanceof EmptyStatement);
            if (!skip) {
                boolean newGroup = statement instanceof SwitchCase && isSwitchBreakingStatement(previous);
                int blankLines = newGroup ? 1 : 0;
                putBlankLinesBefore(statement, blankLines);
            }
            previous = statement;
        }
    }

    private boolean isSwitchBreakingStatement(Statement statement) {
        return statement instanceof BreakStatement
            || statement instanceof ReturnStatement
            || statement instanceof ContinueStatement
            || statement instanceof ThrowStatement
            || statement instanceof Block;
    }

    @Override
    public boolean visit(DoStatement node) {
        Statement body = node.getBody();

        handleLoopBody(body);
        if ((!(body instanceof Block) && !(body instanceof EmptyStatement))) {
            Token whileToken = this.tm.firstTokenBefore(node.getExpression(), TokenNamewhile);
            whileToken.breakBefore();
        }
        return true;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        int openBraceIndex = this.tm.firstIndexIn(node, TokenNameLBRACE);
        int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        if (!(node.getParent() instanceof ArrayInitializer)) {
            this.tm.get(openBraceIndex + 1).indent();
            this.tm.get(closeBraceIndex).unindent();
        }
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        handleAnnotations(node.modifiers(), true);
        return true;
    }

    @Override
    public boolean visit(SingleVariableDeclaration node) {
        boolean parameterConfigValue;
        boolean shouldAddNewLine = node.getParent() instanceof MethodDeclaration;
        parameterConfigValue = node.getParent() instanceof EnhancedForStatement;
        handleAnnotations(node.modifiers(), parameterConfigValue, shouldAddNewLine);

        return true;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        handleAnnotations(node.modifiers(), true);
        return true;
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        return true;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        handleAnnotations(node.modifiers(), true);
        return true;
    }

    private void handleAnnotations(List<? extends IExtendedModifier> modifiers, boolean breakAfter) {
        handleAnnotations(modifiers, breakAfter, false);
    }

    private void handleAnnotations(List<? extends IExtendedModifier> modifiers, boolean breakAfter,
        boolean shouldAddNewLines) {
        Annotation last = null;
        int i;
        for (i = 0; i < modifiers.size(); i++) {
            if (modifiers.get(i).isModifier())
                break;
            last = (Annotation) modifiers.get(i);
            if (last != null && breakAfter && shouldAddNewLines) {
                breakLineBefore(last);
                if (i == modifiers.size() - 1)
                    this.tm.lastTokenIn(last,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                        .breakAfter();
            }
        }

        if (last != null && breakAfter) {
            this.tm.lastTokenIn(last,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                .breakAfter();
        }

        if (i < modifiers.size()) {
            // any annotations following other modifiers will be associated with declaration type
            handleAnnotations(modifiers.subList(i + 1, modifiers.size()), false);
        }
    }

    @Override
    public boolean visit(WhileStatement node) {
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(ForStatement node) {
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(EnhancedForStatement node) {
        handleLoopBody(node.getBody());
        return true;
    }

    private void handleLoopBody(Statement body) {
        if (body instanceof Block)
            return;
        if (body instanceof EmptyStatement && !(body.getParent() instanceof IfStatement))
            return;
        breakLineBefore(body);
        indent(body);
    }

    @Override
    public boolean visit(IfStatement node) {
        Statement elseNode = node.getElseStatement();
        Statement thenNode = node.getThenStatement();
        if (elseNode != null) {
            if (!(thenNode instanceof Block))
                this.tm.firstTokenBefore(elseNode, TokenNameelse).breakBefore();

            boolean keepElseOnSameLine = ((elseNode instanceof IfStatement));
            if (!keepElseOnSameLine)
                handleLoopBody(elseNode);
        }

        handleLoopBody(thenNode);

        return true;
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        // using settings for type declaration and fields for now, add new settings if necessary
        breakLineBefore(node);
        List<ModuleDirective> statements = node.moduleStatements();
        handleBracedCode(node, node.getName());

        ModuleDirective previous = null;
        for (ModuleDirective statement : statements) {
            if (previous != null) {
                boolean cameChunk = previous.getClass().equals(statement.getClass());
                putBlankLinesBefore(statement, cameChunk ? 0 : 1);
            }
            previous = statement;
        }
        return true;
    }

    private void breakLineBefore(ASTNode node) {
        this.tm.firstTokenIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
            .breakBefore();
    }

    private void putBlankLinesBefore(ASTNode node, int linesCount) {
        int index = this.tm.firstIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        while (index > 0 && this.tm.get(index - 1).tokenType == TokenNameCOMMENT_JAVADOC)
            index--;
        putBlankLinesBefore(this.tm.get(index), linesCount);
    }

    private void putBlankLinesBefore(Token token, int linesCount) {
        if (linesCount >= 0) {
            token.putLineBreaksBefore(linesCount + 1);
        } else {
            token.putLineBreaksBefore(~linesCount + 1);
            token.setPreserveLineBreaksBefore(false);
        }
    }

    private void putBlankLinesAfter(Token token, int linesCount) {
        if (linesCount >= 0) {
            token.putLineBreaksAfter(linesCount + 1);
        } else {
            token.putLineBreaksAfter(~linesCount + 1);
            token.setPreserveLineBreaksAfter(false);
        }
    }

    private void handleBracedCode(ASTNode node, ASTNode nodeBeforeOpenBrace) {
        int openBraceIndex = nodeBeforeOpenBrace == null
            ? this.tm.firstIndexIn(node, TokenNameLBRACE)
            : this.tm.firstIndexAfter(nodeBeforeOpenBrace, TokenNameLBRACE);
        int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        Token openBraceToken = this.tm.get(openBraceIndex);
        Token closeBraceToken = this.tm.get(closeBraceIndex);

        putBlankLinesAfter(openBraceToken, 0);
        putBlankLinesBefore(closeBraceToken, 0);

        this.tm.get(openBraceIndex + 1).indent();
        closeBraceToken.unindent();
    }

    private void indent(ASTNode node) {
        int startIndex = this.tm.firstIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        while (startIndex > 0 && this.tm.get(startIndex - 1).isComment())
            startIndex--;
        this.tm.get(startIndex).indent();
        int lastIndex = this.tm.lastIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        if (lastIndex + 1 < this.tm.size())
            this.tm.get(lastIndex + 1).unindent();
    }

    public void finishUp() {
        // the visits only noted where indents increase and decrease,
        // now prepare actual indent values
        int currentIndent = 0;
        for (Token token : this.tm) {
            currentIndent += token.getIndent();
            token.setIndent(currentIndent * 4);
        }
    }

}
