model User {
  @minLength(3)
  @maxLength(50)
  username: string;

  @secret
  password: string;

  @minValue(0)
  @maxValue(200)
  age: uint32;

  @minItems(1)
  @maxItems(10)
  emails: string[];
}

@pattern(".+\\@.+\\..+")
scalar email extends string;
