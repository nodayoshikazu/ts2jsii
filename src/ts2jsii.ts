import { Project, ScriptTarget } from "ts-morph";
import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";

export function visitor(sourceFile: ts.SourceFile) {
    let printing: number = 0;
    let fndepth: number = 0;
    let bridge_output: string = '';
    let global_fn_names: any[] = [];
    
    visitNode(sourceFile);

    function visitNode(node: ts.Node) {
	//console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
	switch (node.kind) {
	    case ts.SyntaxKind.SourceFile:
		break;
	    case ts.SyntaxKind.TypeAliasDeclaration:
		if (ts.isTypeAliasDeclaration(node)) {
		    console.log(`TypeAliasDeclaration=${node.name.escapedText}`);
		}
		break; 

	    case ts.SyntaxKind.Identifier:
		if (ts.isIdentifier(node))
		    if (0 < printing)
			console.log(`Identifier=${node.escapedText}`);
		break; 
	    case ts.SyntaxKind.UnionType:
		console.log('-----UnionType Satrt subtree-----');
		printing++;
		ts.forEachChild(node, visitNode);
		printing--;
		console.log('-----UnionType End subtree-----');
		break;
	    case ts.SyntaxKind.StringKeyword:
		if (0 < printing)
		    console.log(`StringKeyword`);
		break;
	    case ts.SyntaxKind.NumberKeyword:
		if (0 < printing)
		    console.log(`NumberKeyword`);
		break;

	    case ts.SyntaxKind.ClassDeclaration:
		if (ts.isClassDeclaration(node)) {
		    // class name
		    printing++;
		    console.log(`ClassDeclaration=${node.getText()}`);
		    console.log('-----ClassDecl Satrt subtree-----');
		    ts.forEachChild(node, visitNode);
		    console.log('-----ClassDecl End subtree-----');
		    printing--;
		}
		break;
	    case ts.SyntaxKind.Constructor:
		if (0 < printing)		
		    console.log(`Constructor=${node.getText()}`);
		break;
	    case ts.SyntaxKind.MethodDeclaration:
		if (0 < printing)
		    console.log(`Method=${node.getText()}`);
		break;
	    case ts.SyntaxKind.FunctionDeclaration:
		if (ts.isFunctionDeclaration(node)) {
		    // function
		    fndepth++;  // depth==1 if a function is global
		    if (fndepth===1) {
			printing++;
			let fntext = node.getText();  // function code

			let fn = node.name.escapedText;
			global_fn_names.push(fn);
			debugger
			console.log(`L1 FunctionDeclaration=${node.name.escapedText}\n${fntext}`);
			console.log('-----FnDecl Satrt subtree-----');
			ts.forEachChild(node, visitNode);
			console.log('-----FnDecl End subtree-----');
			printing--;
		    }
		    fndepth--;
		}
		break; 

	    case ts.SyntaxKind.ExportKeyword:
	    case ts.SyntaxKind.PropertyDeclaration:

	    case ts.SyntaxKind.Parameter:
	    case ts.SyntaxKind.Block:
	    case ts.SyntaxKind.ExpressionStatement:
	    case ts.SyntaxKind.BinaryExpression:
	    case ts.SyntaxKind.PropertyAccessExpression:
	    case ts.SyntaxKind.ThisKeyword:
	    case ts.SyntaxKind.FirstAssignment:
	    case ts.SyntaxKind.TypeReference:
	    case ts.SyntaxKind.CallExpression:
	    case ts.SyntaxKind.TemplateExpression:
	    case ts.SyntaxKind.TemplateHead:
	    case ts.SyntaxKind.TemplateSpan:
	    case ts.SyntaxKind.TypeOfExpression:
	    case ts.SyntaxKind.LastTemplateToken:
	    case ts.SyntaxKind.StringLiteral:
	    case ts.SyntaxKind.EndOfFileToken:
		break;
	    case ts.SyntaxKind.ForStatement:
	    case ts.SyntaxKind.ForInStatement:
	    case ts.SyntaxKind.WhileStatement:
	    case ts.SyntaxKind.DoStatement:
		if ((node as ts.IterationStatement).statement.kind !== ts.SyntaxKind.Block) {
		    report(
			node,
			'A looping statement\'s contents should be wrapped in a block body.'
		    );
		}
		break;

	    case ts.SyntaxKind.IfStatement:
		const ifStatement = node as ts.IfStatement;
		if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
		    report(ifStatement.thenStatement, 'An if statement\'s contents should be wrapped in a block body.');
		}
		if (
		    ifStatement.elseStatement &&
			ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
			ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement
		) {
		    report(
			ifStatement.elseStatement,
			'An else statement\'s contents should be wrapped in a block body.'
		    );
		}
		break;

	}
	ts.forEachChild(node, visitNode);
	//
    }

    function generateProgram(filenames: string[]): void {
	/*
	  Tried to use ts-morph's
	  project.createSourceFile("MyFile.ts", "const num = 1;");
	  project.emit(); // async

	  but it can only output javascript code. ts-morph does provides a way
	  to maniplate original code but learning how to do it for a small amount of
	  time is difficult. So I opted for a simple fileWrite
	*/
	debugger
	let imp_glfn = "import {\n";
	for (let fnname of global_fn_names) {
	    imp_glfn += `\t${fnname} as ${fnname}Origin,`;
	}
	imp_glfn += "\n} from \"upwork_original\";\n";
	bridge_output += imp_glfn;
	writeFileSync(filenames[0], bridge_output);
    }

    function report(node: ts.Node, message: string) {
	const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
	console.log(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
    }

    //
    generateProgram(['dist/bridge_original.ts']);
}


const fileNames = process.argv.slice(2);
fileNames.forEach(fileName => {
    // Parse a file
    const sourceFile = ts.createSourceFile(
	fileName,
	readFileSync(fileName).toString(),
	ts.ScriptTarget.ES2015,
	/*setParentNodes */ true
    );

    // visitor it
    visitor(sourceFile);
    
});
