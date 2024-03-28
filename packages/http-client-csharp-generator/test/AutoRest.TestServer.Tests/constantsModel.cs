using System;
using System.Linq;
using System.Reflection;
using constants.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ConstantsModelTest
    {
        [Test]
        public void NoModelAsStringNoRequiredTwoValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringNoRequiredTwoValueDefault)));
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringNoRequiredTwoValueDefault));
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(NoModelAsStringNoRequiredTwoValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringNoRequiredTwoValueDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueDefaultEnum_IsEnumWithTwoValues()
        {
            var modelType = typeof(NoModelAsStringNoRequiredTwoValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.True(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetEnumValues().Length);
            TypeAsserts.HasField(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasField(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringNoRequiredTwoValueNoDefault)));
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueNoDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringNoRequiredTwoValueNoDefault));
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueNoDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(NoModelAsStringNoRequiredTwoValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringNoRequiredTwoValueNoDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringNoRequiredTwoValueNoDefaultEnum_IsEnumWithTwoValues()
        {
            var modelType = typeof(NoModelAsStringNoRequiredTwoValueNoDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.True(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetEnumValues().Length);
            TypeAsserts.HasField(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasField(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringNoRequiredOneValueNoDefault)));
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueNoDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringNoRequiredOneValueNoDefault));
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueNoDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringNoRequiredOneValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringNoRequiredOneValueNoDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringNoRequiredOneValueDefault)));
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringNoRequiredOneValueDefault));
        }

        [Test]
        public void NoModelAsStringNoRequiredOneValueDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringNoRequiredOneValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringNoRequiredOneValueDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringRequiredTwoValueNoDefault)));
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueNoDefault_HasOneCtorWithRequiredParam()
        {
            var constructors = typeof(NoModelAsStringRequiredTwoValueNoDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length);
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            Assert.AreEqual(typeof(NoModelAsStringRequiredTwoValueNoDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueNoDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringRequiredTwoValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringRequiredTwoValueNoDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueNoDefaultEnum_IsEnumWithTwoValues()
        {
            var modelType = typeof(NoModelAsStringRequiredTwoValueNoDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.True(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetEnumValues().Length);
            TypeAsserts.HasField(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasField(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueDefault()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringRequiredTwoValueDefault)));
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueDefault_HasOneCtorWithRequiredParam()
        {
            var constructors = typeof(NoModelAsStringRequiredTwoValueDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length);
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            Assert.AreEqual(typeof(NoModelAsStringRequiredTwoValueDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueDefault_HasCtorWithDefaultValue()
        {
            var model = new NoModelAsStringRequiredTwoValueDefault(NoModelAsStringRequiredTwoValueDefaultEnum.Value1);
            Assert.AreEqual(NoModelAsStringRequiredTwoValueDefaultEnum.Value1, model.Parameter);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringRequiredTwoValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringRequiredTwoValueDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringRequiredTwoValueDefaultEnum_IsEnumWithTwoValues()
        {
            var modelType = typeof(NoModelAsStringRequiredTwoValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.True(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetEnumValues().Length);
            TypeAsserts.HasField(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasField(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void NoModelAsStringRequiredOneValueNoDefault()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringRequiredOneValueNoDefault)));
        }

        [Test]
        public void NoModelAsStringRequiredOneValueNoDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringRequiredOneValueNoDefault));
        }

        [Test]
        public void NoModelAsStringRequiredOneValueNoDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringRequiredOneValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringRequiredOneValueNoDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringRequiredOneValueNoDefault_GetPropertyValue()
        {
            var model = new NoModelAsStringRequiredOneValueNoDefault();
            Assert.AreEqual(NoModelAsStringRequiredOneValueNoDefaultEnum.Value1, model.Parameter);
        }

        [Test]
        public void NoModelAsStringRequiredOneValueDefault()
        {
            Assert.True(IsInternal(typeof(NoModelAsStringRequiredOneValueDefault)));
        }

        [Test]
        public void NoModelAsStringRequiredOneValueDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(NoModelAsStringRequiredOneValueDefault));
        }

        [Test]
        public void NoModelAsStringRequiredOneValueDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(NoModelAsStringRequiredOneValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(NoModelAsStringRequiredOneValueDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void NoModelAsStringRequiredOneValueDefault_GetPropertyValue()
        {
            var model = new NoModelAsStringRequiredOneValueDefault();
            Assert.AreEqual(NoModelAsStringRequiredOneValueDefaultEnum.Value1, model.Parameter);
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringNoRequiredTwoValueNoDefault)));
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueNoDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(ModelAsStringNoRequiredTwoValueNoDefault));
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueNoDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(ModelAsStringNoRequiredTwoValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringNoRequiredTwoValueNoDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueNoDefaultEnum_IsStructWithTwoValues()
        {
            var modelType = typeof(ModelAsStringNoRequiredTwoValueNoDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasProperty(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringNoRequiredTwoValueDefault)));
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(ModelAsStringNoRequiredTwoValueDefault));
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(ModelAsStringNoRequiredTwoValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringNoRequiredTwoValueDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringNoRequiredTwoValueDefaultEnum_IsStructWithTwoValues()
        {
            var modelType = typeof(ModelAsStringNoRequiredTwoValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasProperty(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringNoRequiredOneValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringNoRequiredOneValueDefault)));
        }

        [Test]
        public void ModelAsStringNoRequiredOneValueDefault_HasOneDefaultCtor()
        {
            AssertHasDefaultCtor(typeof(ModelAsStringNoRequiredOneValueDefault));
        }

        private static void AssertHasDefaultCtor(Type type)
        {
            var constructors = type.GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            // when the model has default ctor, it should always have another ctor that takes an extra raw data parameter
            Assert.AreEqual(2, constructors.Length);
            Assert.IsTrue(constructors.Any(ctor => ctor.GetParameters().Length == 0));
        }

        [Test]
        public void ModelAsStringNoRequiredOneValueDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(ModelAsStringNoRequiredOneValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringNoRequiredOneValueDefaultEnum?), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringNoRequiredOneValueDefaultEnum_IsStructWithOneValue()
        {
            var modelType = typeof(ModelAsStringNoRequiredOneValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(1, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringRequiredTwoValueNoDefault)));
        }

        [Test]
        public void ModelAsStringRequiredTwoValueNoDefault_HasOneCtorWithRequiredParam()
        {
            var constructors = typeof(ModelAsStringRequiredTwoValueNoDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length);
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            Assert.AreEqual(typeof(ModelAsStringRequiredTwoValueNoDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueNoDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(ModelAsStringRequiredTwoValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringRequiredTwoValueNoDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueNoDefaultEnum_IsStructWithTwoValues()
        {
            var modelType = typeof(ModelAsStringRequiredTwoValueNoDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasProperty(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringRequiredTwoValueDefault)));
        }

        [Test]
        public void ModelAsStringRequiredTwoValueDefault_HasOneCtorWithOptionalParam()
        {
            var constructors = typeof(ModelAsStringRequiredTwoValueDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length);
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            /* eliminate the default value for the parameter property, so the type is not Nullable. */
            Assert.AreEqual(typeof(ModelAsStringRequiredTwoValueDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueDefault_HasCtorWithDefaultValue()
        {
            var model = new ModelAsStringRequiredTwoValueDefault(ModelAsStringRequiredTwoValueDefaultEnum.Value1);
            Assert.AreEqual(ModelAsStringRequiredTwoValueDefaultEnum.Value1, model.Parameter);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(ModelAsStringRequiredTwoValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringRequiredTwoValueDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringRequiredTwoValueDefaultEnum_IsStructWithTwoValues()
        {
            var modelType = typeof(ModelAsStringRequiredTwoValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(2, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
            TypeAsserts.HasProperty(modelType, "Value2", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringRequiredOneValueNoDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringRequiredOneValueNoDefault)));
        }

        [Test]
        public void ModelAsStringRequiredOneValueNoDefault_HasOneCtorWithRequiredParam()
        {
            var constructors = typeof(ModelAsStringRequiredOneValueNoDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length);
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            Assert.AreEqual(typeof(ModelAsStringRequiredOneValueNoDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void ModelAsStringRequiredOneValueNoDefault_PropertiesAreOptionalGetOnly()
        {
            var modelType = typeof(ModelAsStringRequiredOneValueNoDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringRequiredOneValueNoDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringRequiredOneValueNoDefaultEnum_IsStructWithOneValue()
        {
            var modelType = typeof(ModelAsStringRequiredOneValueNoDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(1, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
        }

        [Test]
        public void ModelAsStringRequiredOneValueDefault_IsInternal()
        {
            Assert.True(IsInternal(typeof(ModelAsStringRequiredOneValueDefault)));
        }

        [Test]
        public void ModelAsStringRequiredOneValueDefault_HasOneCtorWithOptionalParam()
        {
            var constructors = typeof(ModelAsStringRequiredOneValueDefault).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.AreEqual(3, constructors.Length); // one with required parameter, one with required parameter and extra raw data, and a default ctor
            var ctor = constructors.SingleOrDefault(ctor => ctor.GetParameters().Length == 1);
            Assert.IsNotNull(ctor);
            /* eliminate the default value for the parameter property, so the type is not Nullable. */
            Assert.AreEqual(typeof(ModelAsStringRequiredOneValueDefaultEnum), ctor.GetParameters()[0].ParameterType);
        }

        [Test]
        public void ModelAsStringRequiredOneValueDefault_HasCtorWithDefaultValue()
        {
            var model = new ModelAsStringRequiredOneValueDefault(ModelAsStringRequiredOneValueDefaultEnum.Value1);
            Assert.AreEqual(ModelAsStringRequiredOneValueDefaultEnum.Value1, model.Parameter);
        }

        [Test]
        public void ModelAsStringRequiredOneValueDefault_PropertiesAreGetOnly()
        {
            var modelType = typeof(ModelAsStringRequiredOneValueDefault);
            Assert.AreEqual(1, modelType.GetProperties().Length);

            var prop = TypeAsserts.HasProperty(modelType, "Parameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(ModelAsStringRequiredOneValueDefaultEnum), prop.PropertyType);
            Assert.Null(prop.SetMethod);
            Assert.NotNull(prop.GetMethod);
        }

        [Test]
        public void ModelAsStringRequiredOneValueDefaultEnum_IsStructWithOneValue()
        {
            var modelType = typeof(ModelAsStringRequiredOneValueDefaultEnum);
            Assert.True(modelType.IsValueType);
            Assert.False(modelType.IsEnum);
            Assert.AreEqual(1, modelType.GetProperties().Length);
            TypeAsserts.HasProperty(modelType, "Value1", BindingFlags.Static | BindingFlags.Public);
        }

        private static bool IsInternal(Type t) => !t.IsVisible
           && !t.IsPublic
           && t.IsNotPublic
           && !t.IsNested
           && !t.IsNestedPublic
           && !t.IsNestedFamily
           && !t.IsNestedPrivate
           && !t.IsNestedAssembly
           && !t.IsNestedFamORAssem
           && !t.IsNestedFamANDAssem;
    }
}
