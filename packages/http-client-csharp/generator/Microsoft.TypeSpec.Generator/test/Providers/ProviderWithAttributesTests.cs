// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class ProviderWithAttributesTests
    {
        public ProviderWithAttributesTests()
        {
            MockHelpers.LoadMockGenerator();
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
            var writer = CodeModelGenerator.Instance.GetWriter(provider);
            var content = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), content.Content);
        }
    }
}
