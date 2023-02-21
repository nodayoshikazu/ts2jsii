"use strict";
exports.__esModule = true;
exports.Ts2jsiiUtils = void 0;
var Handlebars = require("handlebars");
// uses handlebrs.js
var COPY_CLASS_TEMPLATE = "export class {{classname}} {\n    _boxed: {{classname}}Origin;\n";
var COPY_CLASS_CTOR_TEMPLATE = "    constructor({{constructor_signature}}) {\n\t_boxed = new {{classname}}Origin({{params}});\n    }\n";
var COPY_CLASS_METHOD_TEMPLATE = "    {{method_name}}(param: {{union_typename}}) {\n\tthis._boxed.{{method_name}}(param._value);\n    }\n";
var UNION_CLASS_TEMPLATE = "export classs {{classname}} {\n    public _value: any;\n    private constructor(value: {{typetext}}) {\n         this._value = value;\n    }\n"; // add methods and a closing brace at the end
var GLOBAL_TEMPLATE = "export class Globals {\n{{fns}}\n}";
var GLOBAL_FN_TEMPLATE = "    {{fnname}}({{params}}) {\n\treturn {{fnname}}Origin({{pnames}});\n    }\n";
var IMPORT_FN_TEMPLATE = "{{fnname}} as {{fnname}}Origin";
var IMPORT_TEMPLATE = "import {\n    {{imports}}\n} from \"./original\";\n\n";
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
    Ts2jsiiUtils.prototype.findCtorSignatureFromDecl = function (fndecl) {
        var m = fndecl.match(/constructor\(([^\)]+)\)/);
        if (!m) {
            console.error("Error: class constructor is not found in \"".concat(fndecl, "\""));
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
        var ctors = decl.match(/constructor\([^\)]*\)/g);
        var numCtors = ctors.length;
        var results = [];
        for (var _i = 0, ctors_1 = ctors; _i < ctors_1.length; _i++) {
            var ctor = ctors_1[_i];
            // Takes care of overloaded ctors if any
            var sig = this.findCtorSignatureFromDecl(ctor);
            var params = sig.match(/([\S]+)(?=:)/g).join(', ');
            var data = { constructor_signature: sig,
                classname: classname,
                params: params };
            var tmpl = Handlebars.compile(COPY_CLASS_CTOR_TEMPLATE);
            results.push(tmpl(data));
        }
        return results.join('');
    };
    Ts2jsiiUtils.prototype.buildCopyClassMethod = function (decl) {
        var method_name = decl.match(/^([\S]+)(?=\()/)[1];
        var tmpl = Handlebars.compile(COPY_CLASS_METHOD_TEMPLATE);
        var data = { method_name: method_name, union_typename: this.union_typename };
        return tmpl(data);
    };
    Ts2jsiiUtils.prototype.buildUnionClassNameFromTypes = function (text) {
        var _this = this;
        this.union_typename = text;
        var types = text.split(/ *\| */); // remove spaces around |
        var brac2str = function (t) { return _this.capitalizeFirstLetter(t.replace('[]', 'Array')); };
        types = types.map(brac2str);
        var classname = '';
        var tmpl = Handlebars.compile("{{classname}}Or{{typename}}");
        for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
            var t = types_1[_i];
            var data = { classname: classname, typename: t };
            classname = tmpl(data);
        }
        // Remove the first OR
        classname = classname.replace(/^Or/, '');
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
        var abbrevTypes = {
            'string': 'Str',
            'number': 'Num',
            'boolean': 'Bool',
            'any': 'Any',
            'Date': 'Date',
            'Object': 'Obj'
        };
        var _tmpl = "    static from{{typename}}(value: {{typename_orig}}): {{classname}} {\n         return new {{classname}}(value);\n    }";
        var tmpl = Handlebars.compile(_tmpl);
        var methods = [];
        for (var _i = 0, types_2 = types; _i < types_2.length; _i++) {
            var t = types_2[_i];
            var brackets = '';
            var t_o = t;
            if (t.endsWith('[]')) {
                t = t.replace('[]', '');
                brackets = 'Array';
            }
            t = "".concat(abbrevTypes[t]).concat(brackets);
            var data = { classname: classname, typename: t, typename_orig: t_o };
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
        var m = decl.match(/function +([\S]+)\(([^\)]*)\)/);
        if (!m) {
            console.error("Error: function name is not found in \"".concat(decl, "\""));
            return null;
        }
        var fnname = m[1]; // function name
        var params = m[2]; // can be null
        var pnames = '';
        if (0 < params.length) {
            var pn = params.match(/([\S]+)(?=:)/g);
            pnames = pn.join(', ');
        }
        var tmpl = Handlebars.compile(GLOBAL_FN_TEMPLATE);
        var data = { fnname: fnname, params: params, pnames: pnames };
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
