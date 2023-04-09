import ts from 'typescript';
import { ArrayData, ArrayValue, ObjectData, ObjectValue, Value } from '~/types';

export namespace Random {
	export const string = (min: number, max: number = Random.number(min, 15)): string => {
		return [...Array(number(min, max))].map(() => String.fromCharCode(number(0x61, 0x7a))).join('');
	};
	export const number = (min: number = -100, max: number = 100, type: 'int' | 'float' = 'int'): number => {
		if (type === 'int') return Math.floor(Math.random() * (max - min + 1)) + min;
		else return Math.random() * (max - min) + min;
	};
	export const boolean = (): boolean => Math.random() >= 0.5;
	export const array = (data: ArrayData, min: number, max: number = min): ArrayValue => {
		const length = Random.number(min, max);
		const array: Value[] = [];
		for (let i = 0; i < length; i++) {
			const element = Random.gacha(data.elements);
			if (element.kind === ts.SyntaxKind.StringKeyword) array.push(Random.string(1));
			else if (element.kind === ts.SyntaxKind.NumberKeyword) array.push(Random.number());
			else if (element.kind === ts.SyntaxKind.BooleanKeyword) array.push(Random.boolean());
			else if (element.kind === ts.SyntaxKind.ArrayType) array.push(Random.array(element, min, max));
			else if (element.kind === ts.SyntaxKind.TypeLiteral) array.push(Random.object(element));
		}
		return array;
	};
	export const object = (data: ObjectData): ObjectValue => {
		const object: ObjectValue = {};
		for (const key in data.properties) {
			const property = Random.gacha(data.properties[key]);
			if (property.kind === ts.SyntaxKind.StringKeyword) object[key] = Random.string(1);
			else if (property.kind === ts.SyntaxKind.NumberKeyword) object[key] = Random.number();
			else if (property.kind === ts.SyntaxKind.BooleanKeyword) object[key] = Random.boolean();
			else if (property.kind === ts.SyntaxKind.ArrayType) object[key] = Random.array(property, Random.number(1, 7));
			else if (property.kind === ts.SyntaxKind.TypeLiteral) object[key] = Random.object(property);
		}
		return object;
	};
	export const shuffle = <T>(array: T[]): T[] => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	};

	export function gacha<T>(array: T[]): T;
	export function gacha<T extends ts.Node>(array: ts.NodeArray<T>): T;
	export function gacha<T extends ts.Node>(array: unknown[] | ts.NodeArray<T>): unknown | T {
		return array[Random.number(0, array.length - 1)];
	}
}
