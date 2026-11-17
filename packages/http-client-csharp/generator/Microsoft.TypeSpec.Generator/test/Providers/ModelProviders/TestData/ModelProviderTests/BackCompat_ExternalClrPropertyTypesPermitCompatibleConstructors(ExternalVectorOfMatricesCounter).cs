public ExternalVectorOfMatricesCounter(global::Sample.External.ExternalValue[][,] value) : this()
{
    global::Sample.Argument.AssertNotNull(value, nameof(value));

    Value = value;
}
