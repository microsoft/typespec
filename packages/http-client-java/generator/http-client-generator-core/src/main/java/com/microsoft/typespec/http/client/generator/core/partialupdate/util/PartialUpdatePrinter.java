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

/**
 * Prints an already-merged AST using JavaParser's normal formatting and comment placement rules.
 * <p>
 * The default visitor copies, sorts, and searches the parent's children for each child it prints. For classes with
 * many members, that repeats work over the same sibling list. This visitor indexes orphan comments once per parent
 * and leaves printing of declarations and their attached comments to the default visitor.
 */
final class PartialUpdatePrinter {
    private PartialUpdatePrinter() {
    }

    static String print(CompilationUnit compilationUnit) {
        // Go through Node.toString() rather than invoking the printer directly: it applies the compilation unit's
        // original line-ending configuration. The visitor factory also gives each print a fresh comment cache.
        compilationUnit.printer(new DefaultPrettyPrinter(CommentVisitor::new, new DefaultPrinterConfiguration()));
        return compilationUnit.toString();
    }

    private static final class CommentVisitor extends DefaultPrettyPrinterVisitor {
        // Built after merging, while printing no longer mutates the tree. Keep this cache local to the visitor;
        // reusing it after an AST edit would leave stale positions and retain old trees. Identity keys distinguish
        // equal-looking siblings without invoking structural Node.equals/hashCode on their subtrees.
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
                // Attached comments are printed by their declaration's visitor, not this orphan-comment index.
                // The common case needs neither a sorted sibling copy nor a per-child map.
                before = Map.of();
                ending = List.of();
                return;
            }
            // AST insertion order is not necessarily source order after merging two files. Use JavaParser's own
            // stable positional sort, including its handling of missing/equal ranges, without reordering the AST.
            children = new ArrayList<>(children);
            PositionUtils.sortByBeginPosition(children);
            before = new IdentityHashMap<>();
            List<Comment> pending = new ArrayList<>();
            // Each consecutive run of orphan comments belongs before the next non-comment child. Freeze that run
            // in the map by starting a new list, so later comments cannot be added to an earlier child's entry.
            for (Node child : children) {
                if (child instanceof Comment) {
                    pending.add((Comment) child);
                } else if (!pending.isEmpty()) {
                    before.put(child, pending);
                    pending = new ArrayList<>();
                }
            }
            // No following child can print this last run; the parent's ending hook must print it instead.
            ending = pending;
        }
    }
}
