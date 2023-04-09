import ts from 'typescript';

export type PrimitiveValue = string | number | boolean | null;
export type ArrayValue = Value[];
export type ObjectValue = { [key: string]: Value };
export type Value = PrimitiveValue | ArrayValue | ObjectValue;

export type PrimitiveKind = ts.SyntaxKind.StringKeyword | ts.SyntaxKind.NumberKeyword | ts.SyntaxKind.BooleanKeyword;

export type PrimitiveData = {
	kind: PrimitiveKind;
};
export type ArrayData = {
	kind: ts.SyntaxKind.ArrayType;
	elements: Array<PrimitiveData | ArrayData | ObjectData>;
};
export type ObjectData = {
	kind: ts.SyntaxKind.TypeLiteral;
	properties: { [key: string]: Array<PrimitiveData | ArrayData | ObjectData> };
};

export const isPrimitiveKind = (kind: ts.SyntaxKind): kind is PrimitiveKind =>
	kind === ts.SyntaxKind.StringKeyword || kind === ts.SyntaxKind.NumberKeyword || kind === ts.SyntaxKind.BooleanKeyword;
