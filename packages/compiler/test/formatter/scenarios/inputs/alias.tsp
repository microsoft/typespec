alias UnionOfType = Foo | Bar;

alias UnionOfManyType = "one" | "two" | "three" | "four" | "five" | "six" | "seven" | "height" | "nine" | "ten";

alias UnionOfObject = {foo: string} | {bar: string};

alias UnionOfManyObject = {one: string} | {two: string} | {three: string} | {four: string} | {five: string};

alias UnionOfMix = Foo | { bar: string};

alias UnionOfManyMix = Foo | { bar: string} | Bar | Other | {other: string};

alias InterOfObject = {foo: string} & {bar: string};

alias InterOfManyObject = {one: string} & {two: string} & {three: string} & {four: string} & {five: string};

alias InterOfMix = Foo & { bar: string};

alias InterOfManyMix = Foo & { bar: string} & Bar & Other & {other: string};

