# Draft ADL Language Grammar

# Comments

# Structure

### Grammar Legend
- `?` is optional 
- `+?` represents zero or more 
- `+` represents one or more
- `[` ... `]` represents a range of characters
- YAML Array `-` is a choice of one of the elements.

## Lexical Grammar

```yaml
InputElement :
  - Identifier
  - Punctuator
  - Keyword
  - WhiteSpace

Keyword :
  `import`
  `as`
  `alias`
  `annotation`
  `constraint`
  `service`
  `partial`
  `interface`
  `model`
  `enum`
  `constructor`

Punctuator :: one of `|` `<` `>` `(` `)` `{` `}` `:` `,` `;` `[` `]` `.`

IdentifierName :: IdentifierStart IdentifierContinue+?

IdentifierStart :: [A-Za-z]

IdentifierContinue :: [A-Za-z0-9]

WhiteSpace :: one of ` ` `\t` `\r` `\n`

NumericLiteral:
  - DecimalDigits
  - DecimalDigits Dot DecimalDigits
  - DecimalDigits Dot DecimalDigits Exponent
  - Dot DecimalDigits
  - Dot DecimalDigits Exponent
  - DecimalDigits Exponent
  - HexLiteral
  - BinaryLiteral

DecimalDigits: 0-9 DecimalDigits+?

Exponent: ExponentIndicator Sign DecimalDigits

ExponentIndicator: 
  - `e`
  - `E`

Sign: 
  - `+`
  - `-` 

HexLiteral: HexPrefix HexDigits
HexPrefix: 
  - `0x`
  - `0X` 

HexDigits: [0-9a-fA-F] HexDigits+

BinaryLiteral: BinaryPrefix BinaryDigits
BinaryPrefix: 
  - `0b` 
  - `0B`

BinaryDigits: [0-1] BinaryDigits+

BooleanLiteral:
  - `true`
  - `false`

StringLiteral:
  - `"` DoubleStringCharacters+? `"`
  - `\'` SingleStringCharacters+? `'`
  - `\`` BacktickStringCharacters+? `\``

DoubleStringCharacters: DoubleStringCharacter DoubleStringCharacters+?

DoubleStringCharacter:
  - SourceCharacter but not one of `"` or  `\`
  - `\` EscapeSequence

SingleStringCharacters: SingleStringCharacter SingleStringCharacters+?

SingleStringCharacter:
  - SourceCharacter but not one of ``` or  `\`
  - `\` EscapeSequence

BacktickStringCharacters: BacktickStringCharacter BacktickStringCharacters+?

BacktickStringCharacter:
  - SourceCharacter but not one of `\`` or  `\`
  - `\` EscapeSequence

EscapeSequence:
  - EscapeCharacter
  - SourceCharacter but not one of EscapeCharacter

EscapeCharacter: 
  - `"`
  - "'"
  - ```
```

## Syntactic Grammar


``` yaml
Identifier : IdentifierName but not ReservedWord

ADLScript :
  StatementList? 

StatementList : 
  - StatementList? Statement

Statement:
  - ImportStatement+?
  - Declaration+?

ImportStatement:
  - `import` Identifier `;`
  - `import` Identifier `as` `{` `}`
  - `import` Identifier `as` `{` NamedImports `}`

NamedImports: 
  - Identifier
  - NamedImports `,` Identifier

ScopedIdentifier:
  - Identifier
  - Identifier `:` Identifier

Declaration: 
  - TypeDeclaration
  - AnnotationDeclaration
  - ConstraintDeclaration
  - ServiceDeclaration
  - InterfaceDeclaration
  - ResponseDeclaration
  - ResponseGroupDeclaration

TypeDeclaration: 
  - AliasDeclaration
  - ModelDeclaration
  - EnumDeclaration

AliasDeclaration: 
  - `alias` Identifier `:` TypeExpression `;`
  - `alias` Identifier `<` TemplateDeclaration `>` `:` TypeExpression `;`

AnnotationDeclaration: 
  - Annotation+? `annotation` Identifier `(` Parameters `)` `{` LanguageAgnosticScript `}`
  - Annotation+? `annotation` Identifier `(` Parameters `)` `;`

Parameters: 
  - Identifier `:` TypeExpression
  - Identifier `:` TypeExpression `,` Parameters+ 

ConstraintDeclaration: 
  - Annotation+? `constraint` Identifier `(` Parameters `)` `{` LanguageAgnosticAssertionsScript `}`
  - Annotation+? `constraint` Identifier `(` Parameters `)` `;`

ServiceDeclaration: 
  - Annotation+? `partial`? ServiceKeyword Identifier `{` ServiceDefinition `}`
  - Annotation+? `partial`? ServiceKeyword Identifier `;`

ServiceDefinition: # order not important
  - Constructor?
  - InterfaceDeclaration+?

Constructor: 
  - ConstructorKeyword `(` Parameters `)` `;`
  - ConstructorKeyword `(` Parameters `)` `{` LanguageAgnosticScript `}`

InterfaceDeclaration:
  - Annotation+? `partial`? `interface` Identifier `{` InterfaceDefinition `}`
  - Annotation+? `partial`? `interface` Identifier `;`

InterfaceDefinition: 
  - MethodDeclaration+?

MethodDeclaration: 
  - Annotation+? Identifier `(` Parameters `)` MethodResponse

MethodResponse:   # still in discussion
  - Type 
  - InlineResponse

InlineResponse: tba # still in discussion  
ResponseDeclaration: tba # still in discussion
ResponseGroupDeclaration: tba # still in discussion

ModelDeclaration: 
  - Annotation+? `model` Identifier TemplateDeclaration? `;`
  - Annotation+? `model` Identifier TemplateDeclaration? `{` PropertyDefinition+? `}`;
  - Annotation+? `model` `=` Type

TemplateDeclaration: `<` Identifier AdditionalTemplateDeclarations? `>`
AdditionalTemplateDeclarations: `,` Identifier AdditionalTemplateDeclarations+?

AllOf: `:` AllOfValues
AllOfValues:
  - ScopedIdentifier TemplateArguments?
  - ScopedIdentifier TemplateArguments? `,` AllOfValues+

PropertyDefinition:  Annotation+? Identifier `:` TypeExpression `;`

EnumDeclaration: Annotation+? `partial`? `enum` Identifier AllOf? `{` EnumDefinition `}`;
EnumDefinition: Annotation+? Identifier `:` Value `;`
  
TypeExpression: Annotation+? Type

Type: 
  - PrimitiveType    # Built-in Primitive Types
  - LiteralType      # Literal Value Types
  - ScopedIdentifier TemplateArguments? # Enums, Models
  - UnionType        # string|int|boolean etc

TemplateArguments: `<` Identifier AdditionalTemplateArguments? `>`
AdditionalTemplateArguments: `,` Identifier AdditionalTemplateArguments+?

LiteralType: Value

# string & int & boolean
UnionType: 
  - IntersectionType 
  - UnionType `|` IntersectionType

IntersectionType:
  - TypeExpression
  - IntersectionType `&` TypeExpression

Annotation: OpenBracket AnnotationStatement CloseBracket

AnnotationStatement: 
  - Identifier 
  - Identifier `(` `)`
  - Identifier `(` AnnotationArguments `)`


AnnotationArguments: 
  - Value                     
  - Value `,` AnnotationArguments+

Value: 
  - NumericLiteral 
  - StringLiteral
  - BooleanLiteral

 
LanguageAgnosticScript: Undefined # Not in V1
LanguageAgnosticAssertionsScript:  Undefined # Not in V1
```