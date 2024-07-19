// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.StartUp
{
    public class PluginHandlerTests
    {
        [Test]
        public void SelectPluginFindsMatchingPlugin()
        {
            var pluginHandler = new PluginHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.PluginName).Returns("MockPlugin");
            var mockPlugin = new Mock<CodeModelPlugin>();

            pluginHandler.Plugins = new List<System.Lazy<CodeModelPlugin, IMetadata>>
            {
                new(() => mockPlugin.Object, metadataMock.Object),
            };

            Assert.DoesNotThrow(() => pluginHandler.SelectPlugin("MockPlugin"));
            mockPlugin.Verify(p => p.Configure(), Times.Once);
        }

        [Test]
        public void SelectPluginThrowsWhenNoMatch()
        {
            var pluginHandler = new PluginHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.PluginName).Returns("MockPlugin");
            var mockPlugin = new Mock<CodeModelPlugin>();

            pluginHandler.Plugins = new List<System.Lazy<CodeModelPlugin, IMetadata>>
            {
                new(() => mockPlugin.Object, metadataMock.Object),
            };

            Assert.Throws<System.InvalidOperationException>(() => pluginHandler.SelectPlugin("NonExistentPlugin"));
            mockPlugin.Verify(p => p.Configure(), Times.Never);
        }
    }
}
