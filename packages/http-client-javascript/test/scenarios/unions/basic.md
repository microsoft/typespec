# Should generate a type declaration for a basic union

## TypeSpec

```tsp
union DaysOfWeekEnum {
  @doc("Monday.")
  Monday: "Monday",

  @doc("Tuesday.")
  Tuesday: "Tuesday",

  @doc("Wednesday.")
  Wednesday: "Wednesday",

  @doc("Thursday.")
  Thursday: "Thursday",

  @doc("Friday.")
  Friday: "Friday",

  @doc("Saturday.")
  Saturday: "Saturday",

  @doc("Sunday.")
  Sunday: "Sunday",
}
```

## TypeScript

Should generate a type for union with name `DaysOfWeekEnum`

```ts models.ts type DaysOfWeekEnum
export type DaysOfWeekEnum =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
```

# Should generate a type declaration for an extensible union

## TypeSpec

```tsp
union DaysOfWeekExtensibleEnum {
  string,

  @doc("Monday.")
  Monday: "Monday",

  @doc("Tuesday.")
  Tuesday: "Tuesday",

  @doc("Wednesday.")
  Wednesday: "Wednesday",

  @doc("Thursday.")
  Thursday: "Thursday",

  @doc("Friday.")
  Friday: "Friday",

  @doc("Saturday.")
  Saturday: "Saturday",

  @doc("Sunday.")
  Sunday: "Sunday",
}
```

## TypeScript

Should generate a type for union with name `DaysOfWeekExtensibleEnum`

```ts models.ts type DaysOfWeekExtensibleEnum
export type DaysOfWeekExtensibleEnum =
  | string
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
```
