// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.partialupdate.util;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.comments.Comment;
import com.github.javaparser.printer.DefaultPrettyPrinter;
import com.github.javaparser.printer.DefaultPrettyPrinterVisitor;
import com.github.javaparser.printer.configuration.DefaultPrinterConfiguration;
import com.github.javaparser.printer.configuration.DefaultPrinterConfiguration.ConfigOption;
import com.github.javaparser.printer.configuration.PrinterConfiguration;
import com.github.javaparser.utils.PositionUtils;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

/** Prints an already-merged AST without repeatedly sorting each member's siblings for orphan comments. */
final class PartialUpdatePrinter {
    private PartialUpdatePrinter() {
    }

    static String print(CompilationUnit compilationUnit) {
        // Node.toString() applies the compilation unit's original line-ending configuration.
        compilationUnit.printer(new DefaultPrettyPrinter(CommentVisitor::new, new DefaultPrinterConfiguration()));
        return compilationUnit.toString();
    }

    private static final class CommentVisitor extends DefaultPrettyPrinterVisitor {
        // Printing does not mutate the tree. Cache by identity, never by structural Node.equals/hashCode.
        private final Map<Node, Comments> comments = new IdentityHashMap<>();

        private CommentVisitor(PrinterConfiguration configuration) {
            super(configuration);
        }

        @Override
        protected void printOrphanCommentsBeforeThisChildNode(Node node) {
            if (!getOption(ConfigOption.PRINT_COMMENTS).isPresent() || node instanceof Comment) {
                return;
            }
            Node parent = node.getParentNode().orElse(null);
            if (parent != null) {
                comments.computeIfAbsent(parent, Comments::new).before.getOrDefault(node, List.of())
                    .forEach(comment -> comment.accept(this, null));
            }
        }

        @Override
        protected void printOrphanCommentsEnding(Node node) {
            if (getOption(ConfigOption.PRINT_COMMENTS).isPresent()) {
                comments.computeIfAbsent(node, Comments::new).ending.forEach(comment -> comment.accept(this, null));
            }
        }
    }

    private static final class Comments {
        private final Map<Node, List<Comment>> before;
        private final List<Comment> ending;

        private Comments(Node parent) {
            List<Node> children = parent.getChildNodes();
            if (children.stream().noneMatch(Comment.class::isInstance)) {
                before = Map.of();
                ending = List.of();
                return;
            }
            // Match JavaParser's stable positional ordering, including nodes with missing/equal ranges.
            children = new ArrayList<>(children);
            PositionUtils.sortByBeginPosition(children);
            before = new IdentityHashMap<>();
            List<Comment> pending = new ArrayList<>();
            for (Node child : children) {
                if (child instanceof Comment) {
                    pending.add((Comment) child);
                } else if (!pending.isEmpty()) {
                    before.put(child, pending);
                    pending = new ArrayList<>();
                }
            }
            ending = pending;
        }
    }
}
