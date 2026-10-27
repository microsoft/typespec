import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders all constraint attribute helper files.
 * These provide validation at serialization time for numeric, string, and array constraints.
 */
export function ConstraintAttributes(): Children {
  return (
    <>
      <NumericConstraintAttribute />
      <StringConstraintAttribute />
      <ArrayConstraintAttribute />
      <StringArrayConstraintAttribute />
      <NumericArrayConstraintAttribute />
    </>
  );
}

function NumericConstraintAttribute(): Children {
  return (
    <CSharpFile
      path="NumericConstraintAttribute.cs"
      using={["System.Numerics", "System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Provides numeric constraint validation at serialization time
          /// </summary>
          /// <typeparam name="T"></typeparam>
          public class NumericConstraintAttribute<T> : JsonConverterAttribute where T: struct, INumber<T>
          {
            T? _minValue = null, _maxValue = null;

            public NumericConstraintAttribute() { }

            /// <summary>
            /// Provides the minimum value
            /// </summary>
            public T MinValue
            {
              get { return _minValue.HasValue ? _minValue.Value : default(T); }
              set { _minValue = value; }
            }

            /// <summary>
            /// Provides the maximum allowed value
            /// </summary>
            public T MaxValue
            {
              get { return _maxValue.HasValue ? _maxValue.Value : default(T); }
              set { _maxValue = value; }
            }

            /// <summary>
            /// If true, then values greater than but not equal to the minimum value are allowed
            /// </summary>
            public bool MinValueExclusive { get; set; }

            /// <summary>
            /// If true, values less than, but not equal to the provided maximum are allowed
            /// </summary>
            public bool MaxValueExclusive { get; set; }

            public override JsonConverter? CreateConverter(Type typeToConvert)
            {
              return new NumericJsonConverter<T>(_minValue, _maxValue, MinValueExclusive, MaxValueExclusive);
            }
          }

          public class NumericJsonConverter<T> : JsonConverter<T> where T : struct, INumber<T>
          {
            string _rangeString;

            public NumericJsonConverter(T? minValue = null, T? maxValue = null, bool? minValueExclusive = false, bool? maxValueExclusive = false, JsonSerializerOptions? options = null)
            {
              MinValue = minValue;
              MaxValue = maxValue;
              MinValueExclusive = minValueExclusive.HasValue ? minValueExclusive.Value : false;
              MaxValueExclusive = maxValueExclusive.HasValue ? maxValueExclusive.Value : false;
              _rangeString = $"{(MinValue.HasValue ? (MinValueExclusive ? $"({MinValue}" : $"[{MinValue}") : $"[{typeof(T).Name}.Min")}, {(MaxValue.HasValue ? (MaxValueExclusive ? $"{MaxValue})" : $"{MaxValue}]") : $"{typeof(T).Name}.Max]")}";
              if (options != null)
              {
                InnerConverter = options.GetConverter(typeof(T)) as JsonConverter<T>;
              }
            }

            protected T? MinValue { get; }
            protected bool MinValueExclusive { get; }
            protected T? MaxValue { get; }

            protected bool MaxValueExclusive { get; }

            private JsonConverter<T>? InnerConverter { get; set; }

            private JsonConverter<T> GetInnerConverter(JsonSerializerOptions options)
            {
              if (InnerConverter == null)
              {
                InnerConverter = (JsonConverter<T>)options.GetConverter(typeof(T));
              }

              return InnerConverter;
            }

            public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
              var inner = GetInnerConverter(options);
              T candidate = inner.Read(ref reader, typeToConvert, options);
              ValidateRange(candidate);
              return candidate;
            }

            public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
            {
              ValidateRange(value);
              GetInnerConverter(options).Write(writer, value, options);
            }

            protected virtual void ValidateRange(T value)
            {
              if ((MinValue.HasValue && (value < MinValue.Value || (value == MinValue.Value && MinValueExclusive)))
                || (MaxValue.HasValue && (value > MaxValue.Value || (value == MaxValue.Value && MaxValueExclusive))))
                throw new JsonException($"{value} is outside the allowed range of {_rangeString}");
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}

function StringConstraintAttribute(): Children {
  return (
    <CSharpFile
      path="StringConstraintAttribute.cs"
      using={["System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Provides constraints for a string values property
          /// </summary>
          public class StringConstraint : JsonConverterAttribute
          {
            int? _minLength = null, _maxLength = null;

            public StringConstraint() { }

            /// <summary>
            /// The minimum length of the string
            /// </summary>
            public int MinLength
            {
              get { return _minLength.HasValue ? _minLength.Value : 0; }
              set { _minLength = value; }
            }

            /// <summary>
            /// The maximum length of the string
            /// </summary>
            public int MaxLength
            {
              get { return _maxLength.HasValue ? _maxLength.Value : 0; }
              set { _maxLength = value; }
            }

            /// <summary>
            /// The pattern that the string must match
            /// </summary>
            public string? Pattern { get; set; }

            public override JsonConverter? CreateConverter(Type typeToConvert)
            {
              return new StringJsonConverter(_minLength, _maxLength, Pattern);
            }
          }

          public class StringJsonConverter : JsonConverter<string>
          {
            public StringJsonConverter(int? minLength, int? maxLength, string? pattern, JsonSerializerOptions? options = null)
            {
              MinLength = minLength;
              MaxLength = maxLength;
              Pattern = pattern;
              if (options != null)
              {
                InnerConverter = options.GetConverter(typeof(string)) as JsonConverter<string>;
              }
            }

            protected int? MinLength { get; }
            protected int? MaxLength { get; }
            protected string? Pattern { get; }

            private JsonConverter<string>? InnerConverter { get; set; }

            private JsonConverter<string> GetInnerConverter(JsonSerializerOptions options)
            {
              if (InnerConverter == null)
              {
                InnerConverter = (JsonConverter<string>)options.GetConverter(typeof(string));
              }

              return InnerConverter;
            }

            public override bool CanConvert(Type typeToConvert)
            {
              return base.CanConvert(typeToConvert);
            }

            public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
              var innerConverter = GetInnerConverter(options);
              string? candidate = innerConverter.Read(ref reader, typeToConvert, options);
              if (MinLength.HasValue && (candidate == null || candidate.Length < MinLength.Value))
              {
                throw new JsonException($"String length less than minimum length {MinLength.Value}");
              }

              if (candidate != null)
              {
                if (MaxLength.HasValue && candidate.Length > MaxLength.Value)
                {
                  throw new JsonException($"String length greater than maximum length {MaxLength.Value}");
                }

                if (Pattern != null && !System.Text.RegularExpressions.Regex.IsMatch(candidate, Pattern))
                {
                  throw new JsonException($"String does not match pattern {Pattern}");
                }
              }

              return candidate;
            }

            public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
            {
              if (MinLength.HasValue && (value == null || value.Length < MinLength.Value))
              {
                throw new JsonException($"String length less than minimum length {MinLength.Value}");
              }

              if (value != null)
              {
                if (MaxLength.HasValue && value.Length > MaxLength.Value)
                {
                  throw new JsonException($"String length greater than maximum length {MaxLength.Value}");
                }

                if (Pattern != null && !System.Text.RegularExpressions.Regex.IsMatch(value, Pattern))
                {
                  throw new JsonException($"String does not match pattern {Pattern}");
                }

                GetInnerConverter(options).Write(writer, value, options);
              }
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}

function ArrayConstraintAttribute(): Children {
  return (
    <CSharpFile
      path="ArrayConstraintAttribute.cs"
      using={["System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Constrains the number of elements in an array
          /// </summary>
          /// <typeparam name="T">The element type of the array</typeparam>
          public class ArrayConstraintAttribute<T> : JsonConverterAttribute
          {
            int? _minItems = null, _maxItems = null;

            /// <summary>
            /// The smallest number of allowed items
            /// </summary>
            public int MinItems
            {
              get { return _minItems.HasValue ? _minItems.Value : 0; }
              set { _minItems = value; }
            }

            /// <summary>
            /// The largest number of allowed items
            /// </summary>
            public int MaxItems
            {
              get { return _maxItems.HasValue ? _maxItems.Value : 0; }
              set { _maxItems = value; }
            }

            public ArrayConstraintAttribute() { }

            public override JsonConverter? CreateConverter(Type typeToConvert)
            {
              if (typeof(ISet<T>).IsAssignableFrom(typeToConvert))
              {
                return new ConstrainedSetConverter<T>(_minItems, _maxItems);
              }
              else if (typeToConvert.IsArray && typeToConvert.GetElementType() == typeof(T))
              {
                return new ConstrainedStandardArrayConverter<T>(_minItems, _maxItems);
              }
              else
              {
                return new ConstrainedEnumerableConverter<T>(_minItems, _maxItems);
              }
            }
          }

          public abstract class ConstrainedCollectionConverter<T, TCollection> : JsonConverter<TCollection>
          {
            protected ConstrainedCollectionConverter(int? min, int? max)
            {
              _minItems = min;
              _maxItems = max;
            }

            protected int? _minItems, _maxItems;
            public JsonConverter<T>? InnerConverter { get; set; }

            public virtual Func<ConstrainedCollectionConverter<T, TCollection>, JsonSerializerOptions, JsonConverter<T>> InnerConverterFactory { get; set; } =
              ConverterHelpers.GetStandardInnerConverter<T, TCollection>;

            protected bool ValidateMin(int count)
            {
              return !_minItems.HasValue || count >= _minItems.Value;
            }

            protected bool ValidateMax(int count)
            {
              return !_maxItems.HasValue || count <= _maxItems.Value;
            }

            protected void ValidateRange(int count)
            {
              if (!ValidateMax(count) || !ValidateMin(count))
              {
                throw new JsonException($"Number of array elements not in range [{(_minItems.HasValue ? _minItems.Value : 0)}, {(_maxItems.HasValue ? _maxItems.Value : Array.MaxLength)}]");
              }
            }

            public override TCollection? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
              var _innerConverter = InnerConverterFactory(this, options);
              if (reader.TokenType != JsonTokenType.StartArray)
              {
                throw new JsonException("Expected start of array");
              }
              var list = new List<T>();
              int count = 0;
              while (reader.Read())
              {
                if (reader.TokenType == JsonTokenType.EndArray)
                {
                  ValidateRange(count);
                  break;
                }
                if (!ValidateMax(count))
                {
                  ValidateRange(count);
                  break;
                }
                T value = _innerConverter.Read(ref reader, typeof(T), options)!;
                list.Add(value);
                count++;
              }

              return ConvertToCollection(list);
            }

            public override void Write(Utf8JsonWriter writer, TCollection value, JsonSerializerOptions options)
            {
              var _innerConverter = InnerConverterFactory(this, options);
              writer.WriteStartArray();
              foreach (var item in GetEnumerable(value))
                _innerConverter.Write(writer, item, options);
              writer.WriteEndArray();
            }

            protected abstract TCollection ConvertToCollection(List<T> list);
            protected abstract IEnumerable<T> GetEnumerable(TCollection collection);
          }

          public class ConstrainedEnumerableConverter<T> : ConstrainedCollectionConverter<T, IEnumerable<T>>
          {
            public ConstrainedEnumerableConverter(int? min, int? max) : base(min, max) { }

            protected override IEnumerable<T> ConvertToCollection(List<T> list) => list;

            protected override IEnumerable<T> GetEnumerable(IEnumerable<T> collection) => collection;
          }

          public class ConstrainedSetConverter<T> : ConstrainedCollectionConverter<T, ISet<T>>
          {
            public ConstrainedSetConverter(int? min, int? max) : base(min, max) { }

            protected override ISet<T> ConvertToCollection(List<T> list) => new HashSet<T>(list);

            protected override IEnumerable<T> GetEnumerable(ISet<T> collection) => collection;
          }

          public class ConstrainedStandardArrayConverter<T> : ConstrainedCollectionConverter<T, T[]>
          {
            public ConstrainedStandardArrayConverter(int? min, int? max) : base(min, max) { }

            protected override T[] ConvertToCollection(List<T> list) => list.ToArray();

            protected override IEnumerable<T> GetEnumerable(T[] collection) => collection;
          }

          internal static class ConverterHelpers
          {
            internal static JsonConverter<T> GetStandardInnerConverter<T, TCollection>(this ConstrainedCollectionConverter<T, TCollection> converter, JsonSerializerOptions options)
            {
              if (converter.InnerConverter == null)
              {
                converter.InnerConverter = (JsonConverter<T>)options.GetConverter(typeof(T));
              }
              return converter.InnerConverter;
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}

function StringArrayConstraintAttribute(): Children {
  return (
    <CSharpFile
      path="StringArrayConstraintAttribute.cs"
      using={["System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Constrains an array of strings
          /// </summary>
          public class StringArrayConstraintAttribute : ArrayConstraintAttribute<string>
          {
            int? _minItemLength = null, _maxItemLength = null;

            public StringArrayConstraintAttribute() : base() { }

            public int MinItemLength
            {
              get { return _minItemLength.HasValue ? _minItemLength.Value : 0; }
              set { _minItemLength = value; }
            }
            public int MaxItemLength
            {
              get { return _maxItemLength.HasValue ? _maxItemLength.Value : 0; }
              set { _maxItemLength = value; }
            }
            public string? Pattern { get; set; }

            public override JsonConverter? CreateConverter(Type typeToConvert)
            {
              var result = base.CreateConverter(typeToConvert);
              var resultSet = result as ConstrainedSetConverter<string>;
              if (resultSet != null)
              {
                resultSet.InnerConverterFactory = (c, o) =>
                  new StringJsonConverter(MinItemLength, MaxItemLength, Pattern, o);
                return resultSet;
              }

              var resultEnumerable = result as ConstrainedEnumerableConverter<string>;
              if (resultEnumerable != null)
              {
                resultEnumerable.InnerConverterFactory = (c, o) =>
                  new StringJsonConverter(MinItemLength, MaxItemLength, Pattern, o);
                return resultEnumerable;
              }

              var resultStandardArray = result as ConstrainedStandardArrayConverter<string>;
              if (resultStandardArray != null)
              {
                resultStandardArray.InnerConverterFactory = (c, o) =>
                  new StringJsonConverter(MinItemLength, MaxItemLength, Pattern, o);
                return resultStandardArray;
              }
              throw new InvalidOperationException($"Cannot create converter for {typeToConvert} with {this}");
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}

function NumericArrayConstraintAttribute(): Children {
  return (
    <CSharpFile
      path="NumericArrayConstraintAttribute.cs"
      using={["System.Numerics", "System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Constrains an array and the item types within it
          /// </summary>
          /// <typeparam name="T">The item type</typeparam>
          public class NumericArrayConstraintAttribute<T> : ArrayConstraintAttribute<T>
            where T : struct, INumber<T>
          {
            T? _minValue = null, _maxValue = null;

            public NumericArrayConstraintAttribute() : base() { }

            public T MinValue
            {
              get { return _minValue.HasValue ? _minValue.Value : default(T); }
              set { _minValue = value; }
            }
            public T MaxValue
            {
              get { return _maxValue.HasValue ? _maxValue.Value : default(T); }
              set { _maxValue = value; }
            }
            bool MinValueExclusive { get; set; }
            bool MaxValueExclusive { get; set; }

            public override JsonConverter? CreateConverter(Type typeToConvert)
            {
              var result = base.CreateConverter(typeToConvert);
              var resultSet = result as ConstrainedSetConverter<T>;
              if (resultSet != null)
              {
                resultSet.InnerConverterFactory = (c, o) =>
                  new NumericJsonConverter<T>(MinValue, MaxValue, MinValueExclusive, MaxValueExclusive, o);
                return resultSet;
              }
              var resultEnumerable = result as ConstrainedEnumerableConverter<T>;
              if (resultEnumerable != null)
              {
                resultEnumerable.InnerConverterFactory = (c, o) =>
                  new NumericJsonConverter<T>(MinValue, MaxValue, MinValueExclusive, MaxValueExclusive, o);
                return resultEnumerable;
              }
              var resultStandardArray = result as ConstrainedStandardArrayConverter<T>;
              if (resultStandardArray != null)
              {
                resultStandardArray.InnerConverterFactory = (c, o) =>
                  new NumericJsonConverter<T>(MinValue, MaxValue, MinValueExclusive, MaxValueExclusive, o);
                return resultStandardArray;
              }
              throw new InvalidOperationException($"Cannot create converter for {typeToConvert} with {this}");
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}
