import { Project, ScriptTarget } from "ts-morph";
import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { Ts2jsiiUtils } from "./utils";



export function visitor(sourceFile: ts.SourceFile) {
    let printing: number = 0;
    //let class_decl: number = 0;
    let fndepth: number = 0;
    let global_fn_names: any[] = [];
    let import_names: any[] = [];
    let tut = new Ts2jsiiUtils();
    let clazz = '';
    let glob_fns = '';
    let uniontype_class = '';
    let bridge_output = '';

    
    visitNode(sourceFile);

    function visitNode(node: ts.Node) {
	//console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
	switch (node.kind) {
	    case ts.SyntaxKind.UnionType:
		let text = node.getText(); // => 'string | number'
		let classname = tut.buildUnionClassNameFromTypes(text);
		let classtmpl = tut.buildClassTemplateForUnionType(classname);
		let methods   = tut.buildMethodsFromTypes(text, classname);
		uniontype_class = `${classtmpl}${methods}\n}\n`;

		break;
	    case ts.SyntaxKind.ClassDeclaration:
		if (ts.isClassDeclaration(node)) {
		    // class name
		    let decl = node.getText();
		    let classname = tut.findClassNameFromDecl(decl);
		    import_names.push(classname);
		    
		    let t = tut.buildCopyClassTemplate(decl);
		    let ctor = tut.buildCopyClassCtor(decl);
		    clazz = `${t}${ctor}`;
		}
		break;
	    case ts.SyntaxKind.MethodDeclaration:
		let meth_decl = node.getText();
		let method = tut.buildCopyClassMethod(meth_decl);
		clazz = `${clazz}${method}`;
		break;

	    case ts.SyntaxKind.FunctionDeclaration:
		if (ts.isFunctionDeclaration(node)) {
		    // function
		    fndepth++;  // depth==1 if a function is global
		    if (fndepth===1) {
			let fntext = node.getText();  // function code
			let fn = tut.buildGlobalFnFromFunction(fntext);
			let m = fntext.match(/function +([\S]+)\(/);
			global_fn_names.push(fn);
			import_names.push(m[1]);
			glob_fns = tut.buildGlobalFnDecl(global_fn_names);
		    }
		    fndepth--;
		}
		break; 
	    case ts.SyntaxKind.EndOfFileToken:
		let imp = tut.buildImports(import_names);
		bridge_output += imp;
		bridge_output += glob_fns;
		bridge_output += '\n';
		bridge_output += uniontype_class;
		bridge_output += '\n';
		clazz += "\n}\n";
		bridge_output += clazz;
		//console.log(bridge_output);
		console.log('***END***');
		break;
	   /*
	    case ts.SyntaxKind.SourceFile:
	    case ts.SyntaxKind.TypeAliasDeclaration:
	    case ts.SyntaxKind.Identifier:
	    case ts.SyntaxKind.Constructor:
	    case ts.SyntaxKind.StringKeyword:
	    case ts.SyntaxKind.NumberKeyword:
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
	    case ts.SyntaxKind.ForStatement:
	    case ts.SyntaxKind.ForInStatement:
	    case ts.SyntaxKind.WhileStatement:
	    case ts.SyntaxKind.DoStatement:
	    case ts.SyntaxKind.IfStatement:
		break;
            */
	}
	ts.forEachChild(node, visitNode);
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
	writeFileSync(filenames[0], bridge_output);
    }
    //
    generateProgram(['../output/bridge_original.ts']);
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
