import ts from "typescript";

const program = ts.createProgram(["./example.ts"], {});
const sourceFile = program.getSourceFile("./example.ts");
const printer = ts.createPrinter();

const declaredTypes = new Map<string, Set<ts.PropertySignature>>();
sourceFile.statements.filter(ts.isTypeAliasDeclaration).forEach((node) => {
  const typeName = node.name.getText(sourceFile);
  declaredTypes.set(typeName, new Set());
  node.type.forEachChild((child) => {
    if (!ts.isPropertySignature(child)) return;
    declaredTypes.get(typeName).add(child);
  });
});

const randomBoolean = () => Math.random() > 0.5;
const randomString = (): string => Math.random().toString(36).substring(7);
const randomNumber = () => Math.floor(Math.random() * 1000);
const randomArray = (
  length: number,
  kind: ts.SyntaxKind.StringKeyword | ts.SyntaxKind.NumberKeyword
) => {
  const array: (string | number)[] = [];
  for (let i = 0; i < length; i++) {
    array.push(
      kind === ts.SyntaxKind.StringKeyword ? randomString() : randomNumber()
    );
  }
  return array;
};
const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

type Value =
  | boolean
  | string
  | number
  | (string | number)[]
  | { [key: string]: Value }
  | null;
const createDataFromProperty = (property: ts.PropertySignature) => {
  const name = property.name.getText(sourceFile);
  let value: Value = null;
  const type = property.type;
  if (type.kind === ts.SyntaxKind.BooleanKeyword) {
    value = randomBoolean();
  } else if (type.kind === ts.SyntaxKind.StringKeyword) {
    value = randomString();
  } else if (type.kind === ts.SyntaxKind.NumberKeyword) {
    value = randomNumber();
  } else if (ts.isArrayTypeNode(type)) {
    const elementType = type.elementType;
    if (
      ts.isParenthesizedTypeNode(elementType) &&
      ts.isUnionTypeNode(elementType.type)
    ) {
      const unionTypes = elementType.type.types;
      value = shuffle(
        unionTypes.reduce<Array<string | number>>((array, unionType) => {
          if (
            unionType.kind !== ts.SyntaxKind.StringKeyword &&
            unionType.kind !== ts.SyntaxKind.NumberKeyword
          )
            return array;
          array.push(...randomArray(3, unionType.kind));
          return array;
        }, [])
      );
    } else if (
      elementType.kind === ts.SyntaxKind.StringKeyword ||
      elementType.kind === ts.SyntaxKind.NumberKeyword
    ) {
      value = randomArray(3, elementType.kind);
    }
  } else if (ts.isTypeLiteralNode(type)) {
    value = type.members.reduce<Record<string, Value>>((acc, member) => {
      if (!ts.isPropertySignature(member)) return acc;
      const { name, value } = createDataFromProperty(member);
      acc[name] = value;
      return acc;
    }, {});
  } else {
    console.log("Unknown type", type.kind, type.getText(sourceFile));
  }
  return { name, value };
};

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (!ts.isClassDeclaration(node)) return node;
      if (!node.modifiers.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword))
        return node;
      const members = ts.visitNodes<
        ts.ClassElement,
        ts.NodeArray<ts.ClassElement>,
        ts.ClassElement
      >(
        node.members,
        (member) => {
          if (
            !ts.isMethodDeclaration(member) ||
            !ts.isIdentifier(member.name) ||
            !member.name.text.startsWith("fake") ||
            !ts.isTypeReferenceNode(member.type)
          ) {
            return member;
          }
          const declaredType = declaredTypes.get(
            member.type.typeName.getText(sourceFile)
          );
          if (!declaredType) return member;

          const data = Array.from(declaredType).map((property) => {
            const { name, value } = createDataFromProperty(property);
            let initializer:
              | ts.BooleanLiteral
              | ts.StringLiteral
              | ts.NumericLiteral
              | ts.ArrayLiteralExpression
              | ts.ObjectLiteralExpression
              | ts.NullLiteral = ts.factory.createNull();
            if (typeof value === "boolean") {
              initializer = value
                ? ts.factory.createTrue()
                : ts.factory.createFalse();
            } else if (typeof value === "string")
              initializer = ts.factory.createStringLiteral(value);
            else if (typeof value === "number")
              initializer = ts.factory.createNumericLiteral(value);
            else if (Array.isArray(value))
              initializer = ts.factory.createArrayLiteralExpression(
                value.map((v) =>
                  typeof v === "string"
                    ? ts.factory.createStringLiteral(v)
                    : ts.factory.createNumericLiteral(v)
                )
              );
            else if (typeof value === "object")
              initializer = ts.factory.createObjectLiteralExpression(
                Object.entries(value).map(([key, value]) => {
                  let initializer:
                    | ts.BooleanLiteral
                    | ts.StringLiteral
                    | ts.NumericLiteral
                    | ts.ArrayLiteralExpression
                    | ts.ObjectLiteralExpression
                    | ts.NullLiteral = ts.factory.createNull();
                  if (typeof value === "boolean") {
                    initializer = value
                      ? ts.factory.createTrue()
                      : ts.factory.createFalse();
                  } else if (typeof value === "string")
                    initializer = ts.factory.createStringLiteral(value);
                  else if (typeof value === "number")
                    initializer = ts.factory.createNumericLiteral(value);
                  else if (Array.isArray(value))
                    initializer = ts.factory.createArrayLiteralExpression(
                      value.map((v) =>
                        typeof v === "string"
                          ? ts.factory.createStringLiteral(v)
                          : ts.factory.createNumericLiteral(v)
                      )
                    );
                  else if (typeof value === "object")
                    initializer = ts.factory.createObjectLiteralExpression(
                      Object.entries(value).map(([key, value]) => {
                        let initializer:
                          | ts.StringLiteral
                          | ts.NumericLiteral
                          | ts.ArrayLiteralExpression
                          | ts.ObjectLiteralExpression
                          | ts.NullLiteral = ts.factory.createNull();
                        if (typeof value === "string")
                          initializer = ts.factory.createStringLiteral(value);
                        else if (typeof value === "number")
                          initializer = ts.factory.createNumericLiteral(value);
                        else if (Array.isArray(value))
                          initializer = ts.factory.createArrayLiteralExpression(
                            value.map((v) =>
                              typeof v === "string"
                                ? ts.factory.createStringLiteral(v)
                                : ts.factory.createNumericLiteral(v)
                            )
                          );
                        return ts.factory.createPropertyAssignment(
                          key,
                          initializer
                        );
                      }),
                      true
                    );
                  return ts.factory.createPropertyAssignment(key, initializer);
                }),
                true
              );
            return ts.factory.createPropertyAssignment(name, initializer);
          });
          const createdObject = ts.factory.createObjectLiteralExpression(
            data,
            true
          );

          return ts.factory.updateMethodDeclaration(
            member,
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            member.asteriskToken,
            member.name,
            member.questionToken,
            member.typeParameters,
            member.parameters,
            member.type,
            ts.factory.createBlock(
              [ts.factory.createReturnStatement(createdObject)],
              true
            )
          );
        },
        (node): node is ts.ClassElement => "_classElementBrand" in node
      );

      return ts.factory.updateClassDeclaration(
        node,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        node.name,
        node.typeParameters,
        node.heritageClauses,
        members
      );
    };

    return ts.visitEachChild(sourceFile, visitor, context);
  };
};

console.log(`original -> 
${printer.printFile(sourceFile)}`);

const result = ts.transform(sourceFile, [transformer]);
console.log(`transformed -> 
${printer.printFile(result.transformed[0])}`);
