#!/usr/bin/env python
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Convert an APIView token JSON file to a markdown file.

This is a Python port of Export-APIViewMarkdown.ps1 from azure-sdk-tools,
so that api.md generation does not require PowerShell to be installed.
"""

import json
import os
import sys


LANGUAGE_ALIASES = {
    "python": "py",
    "javascript": "js",
    "typescript": "ts",
}


def render_token(token):
    prefix = " " if token.get("HasPrefixSpace") else ""
    suffix = " " if token.get("HasSuffixSpace") else ""
    return f"{prefix}{token.get('Value', '')}{suffix}"


def render_review_lines(review_lines, indent_level=0):
    result = []
    indent = "    " * indent_level

    for line in review_lines:
        tokens = line.get("Tokens", [])
        if not tokens:
            result.append("")
        else:
            line_text = "".join(render_token(t) for t in tokens)
            if line_text.strip():
                result.append(f"{indent}{line_text}")
            else:
                result.append("")

        children = line.get("Children")
        if children:
            child_lines = render_review_lines(children, indent_level + 1)
            result.extend(child_lines)

    return result


def main():
    if len(sys.argv) < 3:
        print("Usage: export_apiview_markdown.py <token_json_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    token_json_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(token_json_path):
        print(f"Token JSON file not found: {token_json_path}", file=sys.stderr)
        sys.exit(1)

    with open(token_json_path, "r", encoding="utf-8") as f:
        token_json = json.load(f)

    review_lines = token_json.get("ReviewLines")
    if not review_lines:
        print("The token JSON file does not contain a 'ReviewLines' property.", file=sys.stderr)
        sys.exit(1)

    # Resolve output path
    if os.path.isdir(output_path):
        output_path = os.path.join(output_path, "api.md")
    elif not os.path.splitext(output_path)[1]:
        output_path = os.path.join(output_path, "api.md")

    # Get language for code fence
    language = (token_json.get("Language") or "").lower()
    language = LANGUAGE_ALIASES.get(language, language)

    rendered_lines = render_review_lines(review_lines)

    output_lines = [f"```{language}"]
    output_lines.extend(rendered_lines)
    output_lines.append("```")

    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(output_lines))

    print(f"Generated markdown: {output_path}")


if __name__ == "__main__":
    main()
