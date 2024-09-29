// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ProviderWithAttributesTests
    {
        public ProviderWithAttributesTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        private class ProviderWithAttribute : TypeProvider
        {
            public ProviderWithAttribute()
            {
            }

            protected override string BuildName() => "ProviderWithAttributes";

            protected override string BuildRelativeFilePath() => ".";

            protected override IReadOnlyList<AttributeStatement> BuildAttributes()
            {
                return [
                    new(typeof(ObsoleteAttribute)),
                    new(typeof(ObsoleteAttribute), Literal("This is obsolete")),
                    new(typeof(ObsoleteAttribute), Literal("This is obsolete"), Literal(true)),
                    new(typeof(ObsoleteAttribute), [new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001"))]),
                    new(typeof(ObsoleteAttribute), [new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001")), new KeyValuePair<string, ValueExpression>("UrlFormat", Literal("my-format"))]),
                    new(typeof(ObsoleteAttribute), [Literal("This is obsolete"), Literal(true)],
                        [new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001")), new KeyValuePair<string, ValueExpression>("UrlFormat", Literal("my-format"))]),
                    ];
            }
        }

        [Test]
        public void ValidateAttributes()
        {
            var provider = new ProviderWithAttribute();
            var writer = CodeModelPlugin.Instance.GetWriter(provider);
            var content = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), content.Content);
        }
    }
}
