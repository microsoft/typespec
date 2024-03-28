// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;
using AutoRest.CSharp.Generation.Writers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace AutoRest.CSharp.AutoRest.Plugins
{
    internal class XmlFormatter
    {
        internal static async Task<string> FormatAsync(XmlDocWriter writer, SyntaxTree syntaxTree)
        {
            var document = writer.Document;
            var methods = await GetMethodsAsync(syntaxTree);
            // first we need to get the members
            var members = writer.Members;

            foreach (var member in members)
            {
                // get the example element
                var exampleElement = member.Element("example");
                if (exampleElement == null)
                    continue;

                foreach (var codeElement in exampleElement.Elements("code"))
                {
                    var testMethodName = codeElement.Value;
                    // find the magic comment and replace it with real code
                    if (methods.TryGetValue(testMethodName, out var methodDeclaration))
                    {
                        var lines = GetLines(methodDeclaration.Body!);
                        var content = FormatContent(lines);
                        // this will give you
                        // <[[CDATA
                        // var our = code;
                        // ]]>
                        codeElement.ReplaceAll(new XCData(content));
                    }
                }
            }

            var swriter = new XmlStringWriter();
            XmlWriterSettings settings = new XmlWriterSettings { OmitXmlDeclaration = false, Indent = true };
            using (XmlWriter xw = XmlWriter.Create(swriter, settings))
            {
                document.Save(xw);
            }

            return swriter.ToString();
        }

        private static string[] GetLines(BlockSyntax methodBlock)
        {
            if (!methodBlock.Statements.Any())
                return Array.Empty<string>();

            // here we have to get the string of all statements and then split by new lines
            // this is because in the StatementSyntax, the NewLines (\n or \r\n) could appear at the end of the statement or at the beginning of the statement
            // therefore to keep it simple, we just combine all the text together and then split by the new lines to trim the extra spaces in front of every line
            var builder = new StringBuilder();
            foreach (var statement in methodBlock.Statements)
            {
                builder.Append(statement.ToFullString());
            }

            return builder.ToString().Split(Environment.NewLine);
        }

        /// <summary>
        /// This method trims the leading spaces of the lines, and it also adds proper amount of spaces to the content of spaces because of the bug of Roslyn: https://github.com/dotnet/roslyn/issues/8269
        /// </summary>
        /// <param name="lines"></param>
        /// <returns></returns>
        internal static string FormatContent(string[] lines)
        {
            if (!lines.Any())
                return string.Empty;

            var builder = new StringBuilder();

            // find the first non-empty line
            int lineNumber = -1;
            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                if (!string.IsNullOrWhiteSpace(line))
                {
                    lineNumber = i;
                    break;
                }
                if (i > 0)
                    builder.AppendLine(); // we do not need a new line when it is the first line
                builder.Append(line);
            }

            if (lineNumber < 0)
                return string.Empty; // every line is whitespaces

            // the following code is a temporarily workaround the Roslyn's format issue around collection initializers: https://github.com/dotnet/roslyn/issues/8269
            // if Roslyn could properly format the collection initializers and everything, this code should be as simple as: take a amount of spaces on the first line, trim spaces with the same amount on every line
            // since the code we are processing here has been formatted by Roslyn, we only take the cases that lines starts or ends with { or } to format.
            var stack = new Stack<int>();
            stack.Push(0);
            const int spaceIncrement = 4;

            for (int i = lineNumber; i < lines.Length; i++)
            {
                var line = lines[i].AsSpan();
                // first we count how many leading spaces we are having on this line
                int count = 0;
                while (count < line.Length && char.IsWhiteSpace(line[count]))
                {
                    count++;
                }
                var spaceCount = count;
                // if the rest part of the line leads by a }, we should decrease the amount of leading spaces
                if (count < line.Length && line[count] == '}')
                {
                    stack.Pop();
                }
                // find out how many spaces we would like to prepend
                var leadingSpaces = stack.Peek();
                // if the rest part of the line leads by a {, we increment the leading space
                if (count < line.Length && line[count] == '{')
                {
                    stack.Push(stack.Peek() + spaceIncrement);
                }
                builder.AppendLine();
                while (leadingSpaces > 0)
                {
                    builder.Append(' ');
                    leadingSpaces--;
                }
                builder.Append(line.Slice(spaceCount));
            }

            return builder.ToString();
        }

        private static async Task<Dictionary<string, MethodDeclarationSyntax>> GetMethodsAsync(SyntaxTree syntaxTree)
        {
            var result = new Dictionary<string, MethodDeclarationSyntax>();
            var root = await syntaxTree.GetRootAsync();

            foreach (var method in root.DescendantNodes().OfType<MethodDeclarationSyntax>())
            {
                result.Add(method.Identifier.Text, method);
            }

            return result;
        }

        private class XmlStringWriter : StringWriter
        {
            public override Encoding Encoding => Encoding.UTF8;
        }
    }
}
