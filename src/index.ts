import ts from 'typescript';
import { createDataFromProperty, createTypescriptExpression } from '~/generator';

const program = ts.createProgram(['./example.ts'], {});
const sourceFile = program.getSourceFile('./example.ts')!;
const printer = ts.createPrinter();

const declaredTypes = new Map<string, Set<ts.PropertySignature>>();
sourceFile.statements.filter(ts.isTypeAliasDeclaration).forEach(node => {
	const typeName = node.name.getText(sourceFile);
	declaredTypes.set(typeName, new Set());
	node.type.forEachChild(child => {
		if (!ts.isPropertySignature(child)) return;
		declaredTypes.get(typeName)!.add(child);
	});
});

const classMemberVisitor = (member: ts.ClassElement): ts.ClassElement => {
	if (
		!ts.isMethodDeclaration(member) ||
		!ts.isIdentifier(member.name) ||
		!member.name.text.startsWith('fake') ||
		!member.type ||
		!ts.isTypeReferenceNode(member.type)
	) {
		return member;
	}
	const declaredType = declaredTypes.get(member.type.typeName.getText(sourceFile));
	if (!declaredType) return member;

	const data = Array.from(declaredType).map(property => {
		const { name, value } = createDataFromProperty(property);
		return ts.factory.createPropertyAssignment(name, createTypescriptExpression(value));
	});
	const createdObject = ts.factory.createObjectLiteralExpression(data, true);

	return ts.factory.updateMethodDeclaration(
		member,
		[ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
		member.asteriskToken,
		member.name,
		member.questionToken,
		member.typeParameters,
		member.parameters,
		member.type,
		ts.factory.createBlock([ts.factory.createReturnStatement(createdObject)], true),
	);
};

const transformer: ts.TransformerFactory<ts.SourceFile> = context => {
	return sourceFile => {
		const visitor = (node: ts.Node): ts.Node => {
			if (!ts.isClassDeclaration(node)) return node;
			if (!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword)) return node;
			const members = ts.visitNodes<ts.ClassElement, ts.NodeArray<ts.ClassElement>, ts.ClassElement>(
				node.members,
				classMemberVisitor,
				(node): node is ts.ClassElement => '_classElementBrand' in node,
			);

			return ts.factory.updateClassDeclaration(
				node,
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				node.name,
				node.typeParameters,
				node.heritageClauses,
				members,
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
