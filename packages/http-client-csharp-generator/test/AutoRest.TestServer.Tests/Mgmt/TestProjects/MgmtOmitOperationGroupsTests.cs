using System;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtOmitOperationGroupTests : TestProjectTests
    {
        public MgmtOmitOperationGroupTests()
            : base("MgmtOmitOperationGroups")
        {
        }

        [TestCase("Model1Data", false)]
        [TestCase("Model1Update", false)]
        [TestCase("Model1ListResult", false)]
        [TestCase("Model2Data", true)]
        [TestCase("ModelX", true)]
        [TestCase("ModelY", true)]
        [TestCase("Model4Data", false)]
        [TestCase("Model5Data", false)]
        [TestCase("ModelZ", true)]
        [TestCase("ModelQ", true)]
        [TestCase("ModelP", false)]
        public void ValidateOperationGroupExistence(string className, bool isExist)
        {
            Assert.AreEqual(isExist, CheckExistence(className));
        }

        private bool CheckExistence(string className)
        {
            if (Type.GetType(GetTypeName(className)) == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        private string GetTypeName(string className)
        {
            string @namespace = "MgmtOmitOperationGroups";

            return className.EndsWith("Data") ? $"{@namespace}.{className}" : $"{@namespace}.Models.{className}";
        }
    }
}
