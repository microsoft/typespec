using System.Linq;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    internal class MgmtCustomizationTests : TestProjectTests
    {
        public MgmtCustomizationTests() : base("MgmtCustomizations") { }

        [TestCase("Cat", new string[] { "sleep", "jump" })]
        [TestCase("Dog", new string[] { "jump" })]
        public void ValidateOverloadMethodsForModelFactory(string methodName, string[] parameterNames)
        {
            var classToCheck = FindModelFactory();
            if (classToCheck is not null)
            {
                ValidateOverloadMethods(classToCheck.Name, methodName, parameterNames, classToCheck);
            }
        }

        private static void ValidateOverloadMethods(string className, string methodName, string[] parameterNames, System.Type classToCheck)
        {
            var methods = classToCheck.GetMethods().Where(method => method.Name == methodName);
            Assert.GreaterOrEqual(methods.Count(), 2, $"Overloading methods not found for {className}.{methodName}");
            var overloadMethodParameterNames = methods.OrderBy(method => method.GetParameters().Length).Last().GetParameters().Select(x => x.Name.ToLowerInvariant()).ToList();

            foreach (var name in parameterNames)
            {
                Assert.Contains(name, overloadMethodParameterNames, $"{name} is missing in overload method {className}.{methodName}");
            }
        }
    }
}
