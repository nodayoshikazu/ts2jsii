"use strict";
exports.__esModule = true;
exports.visitor = void 0;
var fs_1 = require("fs");
var ts = require("typescript");
var utils_1 = require("./utils");
function visitor(sourceFile) {
    var printing = 0;
    //let class_decl: number = 0;
    var fndepth = 0;
    var global_fn_names = [];
    var import_names = [];
    var tut = new utils_1.Ts2jsiiUtils();
    var clazz = '';
    var glob_fns = '';
    var uniontype_class = '';
    var bridge_output = '';
    visitNode(sourceFile);
    function visitNode(node) {
        //console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
        switch (node.kind) {
            case ts.SyntaxKind.UnionType:
                var text = node.getText(); // => 'string | number'
                var classname = tut.buildUnionClassNameFromTypes(text);
                var classtmpl = tut.buildClassTemplateForUnionType(classname);
                var methods = tut.buildMethodsFromTypes(text, classname);
                uniontype_class = "".concat(classtmpl).concat(methods, "\n}\n");
                break;
            case ts.SyntaxKind.ClassDeclaration:
                if (ts.isClassDeclaration(node)) {
                    // class name
                    var decl = node.getText();
                    var classname_1 = tut.findClassNameFromDecl(decl);
                    import_names.push(classname_1);
                    var t = tut.buildCopyClassTemplate(decl);
                    var ctor = tut.buildCopyClassCtor(decl);
                    clazz = "".concat(t).concat(ctor);
                }
                break;
            case ts.SyntaxKind.MethodDeclaration:
                var meth_decl = node.getText();
                var method = tut.buildCopyClassMethod(meth_decl);
                clazz = "".concat(clazz).concat(method);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                if (ts.isFunctionDeclaration(node)) {
                    // function
                    fndepth++; // depth==1 if a function is global
                    if (fndepth === 1) {
                        var fntext = node.getText(); // function code
                        var fn = tut.buildGlobalFnFromFunction(fntext);
                        var m = fntext.match(/function +([\S]+)\(/);
                        global_fn_names.push(fn);
                        import_names.push(m[1]);
                        glob_fns = tut.buildGlobalFnDecl(global_fn_names);
                    }
                    fndepth--;
                }
                break;
            case ts.SyntaxKind.EndOfFileToken:
                var imp = tut.buildImports(import_names);
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
    function generateProgram(filenames) {
        /*
          Tried to use ts-morph's
          project.createSourceFile("MyFile.ts", "const num = 1;");
          project.emit(); // async
    
          but it can only output javascript code. ts-morph does provides a way
          to maniplate original code but learning how to do it for a small amount of
          time is difficult. So I opted for a simple fileWrite
        */
        (0, fs_1.writeFileSync)(filenames[0], bridge_output);
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
