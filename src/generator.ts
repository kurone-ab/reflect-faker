import ts from 'typescript';
import { ArrayData, isPrimitiveKind, ObjectData, PrimitiveData, PrimitiveKind, Value } from '~/types';
import { Random } from '~/random';

const createPrimitiveData = (kind: PrimitiveKind): PrimitiveData => ({ kind });
const createArrayData = (node: ts.ArrayTypeNode): ArrayData => {
	const { elementType } = node;
	if (ts.isArrayTypeNode(elementType)) return createArrayData(elementType);
	const elementTypes =
		ts.isParenthesizedTypeNode(elementType) && ts.isUnionTypeNode(elementType.type)
			? elementType.type.types
			: [elementType];
	return {
		kind: ts.SyntaxKind.ArrayType,
		elements: elementTypes.map(type => {
			if (isPrimitiveKind(type.kind)) {
				return { kind: type.kind };
			} else if (ts.isArrayTypeNode(type)) {
				return createArrayData(type);
			} else if (ts.isTypeLiteralNode(type)) {
				return createObjectData(type);
			} else {
				throw new Error('Unknown type');
			}
		}),
	};
};
const createObjectData = (node: ts.TypeLiteralNode): ObjectData => {
	const { members } = node;
	return {
		kind: ts.SyntaxKind.TypeLiteral,
		properties: members.reduce<ObjectData['properties']>((acc, member) => {
			if (!ts.isPropertySignature(member)) return acc;
			const { name, type } = member;
			if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) return acc;
			if (!type) return acc;
			const key = name.text;
			const types = ts.isUnionTypeNode(type) ? type.types : [type];
			acc[key] = types.map<PrimitiveData | ArrayData | ObjectData>(type => {
				if (isPrimitiveKind(type.kind)) {
					return createPrimitiveData(type.kind);
				} else if (ts.isArrayTypeNode(type)) {
					return createArrayData(type);
				} else if (ts.isTypeLiteralNode(type)) {
					return createObjectData(type);
				} else {
					throw new Error('Unknown type');
				}
			});
			return acc;
		}, {}),
	};
};

export const createDataFromProperty = (property: ts.PropertySignature): { name: string; value: Value } => {
	if (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name)) throw new Error('Unknown name');
	const name = property.name.text;
	let type = property.type;
	if (!type) throw new Error('Unknown type');
	if (ts.isUnionTypeNode(type)) type = Random.gacha(Array.from(type.types));
	let value: Value = null;
	if (type.kind === ts.SyntaxKind.StringKeyword) {
		value = Random.string(1);
	} else if (type.kind === ts.SyntaxKind.NumberKeyword) {
		value = Random.number();
	} else if (type.kind === ts.SyntaxKind.BooleanKeyword) {
		value = Random.boolean();
	} else if (ts.isArrayTypeNode(type)) {
		value = Random.array(createArrayData(type), 1, 7);
	} else if (ts.isTypeLiteralNode(type)) {
		value = Random.object(createObjectData(type));
	} else {
		console.error('Unknown type', name, type.kind);
	}
	return { name, value };
};

export const createTypescriptExpression = (value: Value): ts.Expression => {
	if (value === null) return ts.factory.createNull();
	if (typeof value === 'string') return ts.factory.createStringLiteral(value);
	if (typeof value === 'number') return ts.factory.createNumericLiteral(value);
	if (typeof value === 'boolean') return value ? ts.factory.createTrue() : ts.factory.createFalse();
	if (Array.isArray(value)) {
		return ts.factory.createArrayLiteralExpression(value.map(createTypescriptExpression));
	}
	if (typeof value === 'object') {
		const properties = Object.entries(value).map(([key, value]) => {
			return ts.factory.createPropertyAssignment(key, createTypescriptExpression(value));
		});
		return ts.factory.createObjectLiteralExpression(properties, true);
	}
	return ts.factory.createNull();
};
