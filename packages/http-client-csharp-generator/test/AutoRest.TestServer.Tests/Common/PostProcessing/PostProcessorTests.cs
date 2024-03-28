// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Output.PostProcessing;
using Microsoft.CodeAnalysis;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Common.PostProcessing;

internal class PostProcessorTests
{
    internal class TestPostProcessor : PostProcessor
    {
        public TestPostProcessor(ImmutableHashSet<string> modelsToKeep) : base(modelsToKeep)
        {
        }

        protected override bool IsRootDocument(Document document)
        {
            return document.Name.EndsWith("Client.cs");
        }
    }

    private Project _project;

    [SetUp]
    public void Setup()
    {
        var workspace = new AdhocWorkspace();
        _project = workspace.AddProject("TestPostProcessorProject", LanguageNames.CSharp);
        foreach ((var filename, var text) in SourceCodeContents)
        {
            _project = _project.AddDocument(filename, text).Project;
        }
    }

    [TestCase("TestSDK.Client", true, false)]
    [TestCase("TestSDK.Model", true, false)]
    [TestCase("TestSDK.ModelProperties", true, false)]
    [TestCase("TestSDK.UnusedModel", false, null)]
    [TestCase("TestSDK.ListItem", true, false)]
    [TestCase("TestSDK.NestedItem", true, false)]
    [TestCase("TestSDK.InternalUsageModel", true, true)]
    [TestCase("TestSDK.PageableItem", true, false)]
    public async Task ValidateTypeAccessibility(string typeFullName, bool exist, bool? isInternal)
    {
        var postProcessor = new TestPostProcessor(ImmutableHashSet<string>.Empty);

        _project = await postProcessor.InternalizeAsync(_project);

        _project = await postProcessor.RemoveAsync(_project);

        var compilation = await _project.GetCompilationAsync();
        Assert.IsNotNull(compilation);

        var typeSymbol = compilation.GetTypeByMetadataName(typeFullName);

        if (exist)
        {
            Assert.IsNotNull(typeSymbol);
            Assert.IsNotNull(isInternal);
            Assert.AreEqual(isInternal, typeSymbol.DeclaredAccessibility == Microsoft.CodeAnalysis.Accessibility.Internal);
        }
        else
        {
            Assert.IsNull(typeSymbol);
        }
    }

    private const string Client = @"
using Azure;
using System;
using System.Threading.Tasks;

namespace TestSDK
{
    public partial class Client
    {
        public Client() { }

        public Task<Response<Model>> DoSomethingAsync(CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Response<Model> DoSomething(CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public AsyncPageable<PageableItem> DoPageableAsync(CancellationToken cancellationToken = default)
        {
            var internalUsage = new InternalUsageModel();
            throw new NotImplementedException();
        }

        public Pageable<PageableItem> DoPageable(CancellationToken cancellationToken = default)
        {
            var internalUsage = new InternalUsageModel();
            throw new NotImplementedException();
        }
    }
}
";

    private const string Model = @"
namespace TestSDK
{
    public class Model
    {
        public Model()
        {
        }

        internal Model(string name, string version, ModelProperties properties)
        {
            Name = name;
            Version = version;
            Properties = properties;
        }

        public string Name { get; }

        public string Version { get; set; }

        public ModelProperties Properties { get; set; }
    }
}
";

    private const string ModelProperties = @"
namespace TestSDK
{
    public class ModelProperties
    {
        public ModelProperties()
        {
        }

        internal ModelProperties(int sourceLevel)
        {
            SourceLevel = sourceLevel;
        }

        public int SourceLevel { get; set; }

        public IList<ListItem> Items { get; }

        public IReadOnlyList<IList<NestedItem>> NestedItems { get; }
    }
}
";

    private const string UnusedModel = @"
namespace TestSDK
{
    public class UnusedModel
    {
        public UnusedModel()
        {
        }

        internal UnusedModel(string name)
        {
            Name = name;
        }

        public string Name { get; set; }
    }
}
";

    private const string ListItem = @"
namespace TestSDK
{
    public class ListItem
    {
        public ListItem()
        {
        }

        internal ListItem(string foo)
        {
            Foo = foo;
        }

        public string Foo { get; }
    }
}
";

    private const string NestedItem = @"
namespace TestSDK
{
    public class NestedItem
    {
        public NestedItem() { }

        internal NestedItem(string bar)
        {
            Bar = bar;
        }

        public string Bar { get; set; }
    }
}
";

    private const string InternalUsageModel = @"
using System;
using System.Collections.Generic;

namespace TestSDK
{
    public class InternalUsageModel
    {
        public InternalUsageModel()
        {
        }

        internal InternalUsageModel(IEnumerable<PageableResult> values, string nextLink)
        {
            Values = values.ToList();
            NextLink = nextLink;
        }

        public IList<PageableItem> Values { get; }
        public string NextLink { get; }
    }
}
";

    private const string PageableItem = @"
using System;

namespace TestSDK
{
    public class PageableItem
    {
        public PageableItem()
        {
        }

        internal PageableItem(string information, DateTime createdOn)
        {
            Information = information;
            CreatedOn = createdOn;
        }

        public string Information { get; }

        public DateTime CreatedOn { get; }
    }
}
";

    private readonly Dictionary<string, string> SourceCodeContents = new()
    {
        [$"{nameof(Client)}.cs"] = Client,
        [$"{nameof(Model)}.cs"] = Model,
        [$"{nameof(ModelProperties)}.cs"] = ModelProperties,
        [$"{nameof(UnusedModel)}.cs"] = UnusedModel,
        [$"{nameof(ListItem)}.cs"] = ListItem,
        [$"{nameof(NestedItem)}.cs"] = NestedItem,
        [$"{nameof(InternalUsageModel)}.cs"] = InternalUsageModel,
        [$"{nameof(PageableItem)}.cs"] = PageableItem,
    };
}
