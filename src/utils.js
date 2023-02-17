"use strict";
exports.__esModule = true;
exports.Ts2jsiiUtils = void 0;
//import { handlebars } from "handlebars";
var Handlebars = require("handlebars");
// uses handlebrs.js
var COPY_CLASS_TEMPLATE = "export class {{classname}} {\n    _boxed: {{classname}}Origin;\n";
var COPY_CLASS_CTOR_TEMPLATE = "    constructor({{constructor_signature}}) {\n\t_boxed = new {{classname}}Origin({{params}});\n    }\n";
var COPY_CLASS_METHOD_TEMPLATE = "    {{method_name}}(param: {{union_typename}}) {\n\tthis._boxed.{{method_name}}(param._value);\n    }\n";
var UNION_CLASS_TEMPLATE = "export classs {{classname}} {\n    public _value: any;\n    private constructor(value: {{typetext}}) {\n         this._value = value;\n    }\n"; // add methods and a closing brace at the end
var GLOBAL_TEMPLATE = "export class Globals {\n{{fns}}\n}";
var GLOBAL_FN_TEMPLATE = "    {{fnname}}() {\n\treturn {{fnname}}Origin();\n    }\n";
var IMPORT_FN_TEMPLATE = "{{fnname}} as {{fnname}}Origin";
var IMPORT_TEMPLATE = "import {\n    // foo as fooOrigin\n    {{imports}}\n} from \"./upwork_original\";\n\n";
var Ts2jsiiUtils = /** @class */ (function () {
    function Ts2jsiiUtils() {
    }
    Ts2jsiiUtils.prototype.capitalizeFirstLetter = function (str) {
        return "".concat(str.charAt(0).toUpperCase()).concat(str.slice(1));
    };
    Ts2jsiiUtils.prototype.findClassNameFromDecl = function (decl) {
        var m = decl.match(/class +([\S]+)/);
        if (!m) {
            console.error("Error: class name is not found in \"".concat(decl, "\""));
            return null;
        }
        return m[1];
    };
    // e.g.constructor(name: string, age: number) 
    Ts2jsiiUtils.prototype.findCtorSignatureFromDecl = function (decl) {
        var m = decl.match(/constructor\(([^\)]+)\)/);
        if (!m) {
            console.error("Error: class constructor is not found in \"".concat(decl, "\""));
            return null;
        }
        return m[1];
    };
    Ts2jsiiUtils.prototype.buildCopyClassTemplate = function (class_decl) {
        var classname = this.findClassNameFromDecl(class_decl);
        var data = { classname: classname };
        var tmpl = Handlebars.compile(COPY_CLASS_TEMPLATE);
        // add ctor, method afer this
        return tmpl(data);
    };
    Ts2jsiiUtils.prototype.buildCopyClassCtor = function (decl) {
        var classname = this.findClassNameFromDecl(decl);
        var sig = this.findCtorSignatureFromDecl(decl);
        var params = sig.match(/([\S]+)(?=:)/g).join(', ');
        var data = { constructor_signature: sig, classname: classname, params: params };
        var tmpl = Handlebars.compile(COPY_CLASS_CTOR_TEMPLATE);
        return tmpl(data);
    };
    /*
    greet(param: UnionType) {
    console.log(`The parameter is of type ${typeof param}`);
    }
    */
    Ts2jsiiUtils.prototype.buildCopyClassMethod = function (decl) {
        var method_name = decl.match(/^([\S]+)(?=\()/)[1];
        var tmpl = Handlebars.compile(COPY_CLASS_METHOD_TEMPLATE);
        var data = { method_name: method_name, union_typename: this.union_typename };
        return tmpl(data);
    };
    Ts2jsiiUtils.prototype.buildUnionClassNameFromTypes = function (text) {
        this.union_typename = text;
        var types = text.split(/ *\| */); // remove spaces around |
        var classname = this.capitalizeFirstLetter(types[0]);
        var tmpl = Handlebars.compile("{{classname}}Or{{typename}}");
        for (var i = 1; i < types.length; i++) {
            var data = { classname: classname, typename: this.capitalizeFirstLetter(types[i]) };
            classname = tmpl(data);
        }
        return classname;
    };
    Ts2jsiiUtils.prototype.buildClassTemplateForUnionType = function (classname) {
        var tmpl = Handlebars.compile(UNION_CLASS_TEMPLATE);
        var data = { classname: classname, typetext: this.union_typename };
        var union_class_template2 = tmpl(data);
        return union_class_template2;
    };
    Ts2jsiiUtils.prototype.buildMethodsFromTypes = function (text, classname) {
        var types = text.split(/ *\| */); // remove spaces around |
        var _tmpl = "    static from{{typename}}(value: {{typename}}): {{classname}} {\n         return new {{classname}}(value);\n    }";
        var tmpl = Handlebars.compile(_tmpl);
        var methods = [];
        for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
            var t = types_1[_i];
            var data = { classname: classname, typename: t };
            methods.push(tmpl(data));
        }
        return methods.join('\n');
    };
    Ts2jsiiUtils.prototype.buildGlobalFnFromFunction = function (decl) {
        /*
          e.g. export function globalExample() {
                      console.log("this is a global function");
              }
        */
        var m = decl.match(/function +([\S]+)\(/);
        if (!m) {
            console.error("Error: function name is not found in \"".concat(decl, "\""));
            return null;
        }
        var fnname = m[1]; // function name
        var tmpl = Handlebars.compile(GLOBAL_FN_TEMPLATE);
        var data = { fnname: fnname };
        return tmpl(data);
    };
    Ts2jsiiUtils.prototype.buildGlobalFnDecl = function (fns) {
        var tmpl = Handlebars.compile(GLOBAL_TEMPLATE);
        var fns_str = fns.join('\n');
        var data = { fns: fns_str };
        return tmpl(data);
    };
    Ts2jsiiUtils.prototype.buildImports = function (import_names) {
        var fn_tmpl = Handlebars.compile(IMPORT_FN_TEMPLATE);
        var tmpl = Handlebars.compile(IMPORT_TEMPLATE);
        var fns = [];
        for (var _i = 0, import_names_1 = import_names; _i < import_names_1.length; _i++) {
            var fn = import_names_1[_i];
            var imp = fn_tmpl({ fnname: fn });
            fns.push(imp);
        }
        var imp_str = fns.join(',\n    ');
        var data = { imports: imp_str };
        return tmpl(data);
    };
    return Ts2jsiiUtils;
}());
exports.Ts2jsiiUtils = Ts2jsiiUtils;
;
