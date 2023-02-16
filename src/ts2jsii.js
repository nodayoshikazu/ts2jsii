"use strict";
exports.__esModule = true;
exports.visitor = void 0;
var fs_1 = require("fs");
var ts = require("typescript");
function visitor(sourceFile) {
    var printing = 0;
    var fndepth = 0;
    var bridge_output = '';
    var global_fn_names = [];
    visitNode(sourceFile);
    function visitNode(node) {
        //console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
                break;
            case ts.SyntaxKind.TypeAliasDeclaration:
                if (ts.isTypeAliasDeclaration(node)) {
                    console.log("TypeAliasDeclaration=".concat(node.name.escapedText));
                }
                break;
            case ts.SyntaxKind.Identifier:
                if (ts.isIdentifier(node))
                    if (0 < printing)
                        console.log("Identifier=".concat(node.escapedText));
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
                    console.log("StringKeyword");
                break;
            case ts.SyntaxKind.NumberKeyword:
                if (0 < printing)
                    console.log("NumberKeyword");
                break;
            case ts.SyntaxKind.ClassDeclaration:
                if (ts.isClassDeclaration(node)) {
                    // class name
                    printing++;
                    console.log("ClassDeclaration=".concat(node.getText()));
                    console.log('-----ClassDecl Satrt subtree-----');
                    ts.forEachChild(node, visitNode);
                    console.log('-----ClassDecl End subtree-----');
                    printing--;
                }
                break;
            case ts.SyntaxKind.Constructor:
                if (0 < printing)
                    console.log("Constructor=".concat(node.getText()));
                break;
            case ts.SyntaxKind.MethodDeclaration:
                if (0 < printing)
                    console.log("Method=".concat(node.getText()));
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                if (ts.isFunctionDeclaration(node)) {
                    // function
                    fndepth++; // depth==1 if a function is global
                    if (fndepth === 1) {
                        printing++;
                        var fntext = node.getText(); // function code
                        var fn = node.name.escapedText;
                        global_fn_names.push(fn);
                        debugger;
                        console.log("L1 FunctionDeclaration=".concat(node.name.escapedText, "\n").concat(fntext));
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
                if (node.statement.kind !== ts.SyntaxKind.Block) {
                    report(node, 'A looping statement\'s contents should be wrapped in a block body.');
                }
                break;
            case ts.SyntaxKind.IfStatement:
                var ifStatement = node;
                if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
                    report(ifStatement.thenStatement, 'An if statement\'s contents should be wrapped in a block body.');
                }
                if (ifStatement.elseStatement &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement) {
                    report(ifStatement.elseStatement, 'An else statement\'s contents should be wrapped in a block body.');
                }
                break;
        }
        ts.forEachChild(node, visitNode);
        //
    }
    function generateProgram(filenames) {
        /*
          Tried to use ts-morph's
          project.createSourceFile("MyFile.ts", "const num = 1;");
          project.emit(); // async
    
          but it can only output javascript code. ts-morph does provides a way
          to maniplate original code but learning how to do it for a small amount of
          time is difficult. So I opted for a simple fileWrite
        */
        debugger;
        var imp_glfn = "import {\n";
        for (var _i = 0, global_fn_names_1 = global_fn_names; _i < global_fn_names_1.length; _i++) {
            var fnname = global_fn_names_1[_i];
            imp_glfn += "\t".concat(fnname, " as ").concat(fnname, "Origin,");
        }
        imp_glfn += "\n} from \"upwork_original\";\n";
        bridge_output += imp_glfn;
        (0, fs_1.writeFileSync)(filenames[0], bridge_output);
    }
    function report(node, message) {
        var _a = sourceFile.getLineAndCharacterOfPosition(node.getStart()), line = _a.line, character = _a.character;
        console.log("".concat(sourceFile.fileName, " (").concat(line + 1, ",").concat(character + 1, "): ").concat(message));
    }
    //
    generateProgram(['../output/bridge_original.ts']);
}
exports.visitor = visitor;
var fileNames = process.argv.slice(2);
fileNames.forEach(function (fileName) {
    // Parse a file
    var sourceFile = ts.createSourceFile(fileName, (0, fs_1.readFileSync)(fileName).toString(), ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    // visitor it
    visitor(sourceFile);
});
