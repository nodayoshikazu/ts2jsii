//import { handlebars } from "handlebars";
import * as Handlebars from 'handlebars';

// uses handlebrs.js

const COPY_CLASS_TEMPLATE: string = 
`export class {{classname}} {
    _boxed: {{classname}}Origin;
`;

const COPY_CLASS_CTOR_TEMPLATE: string = 
`    constructor({{constructor_signature}}) {
	_boxed = new {{classname}}Origin({{params}});
    }
`;

const COPY_CLASS_METHOD_TEMPLATE: string =
`    {{method_name}}(param: {{union_typename}}) {
	this._boxed.{{method_name}}(param._value);
    }
`;

const UNION_CLASS_TEMPLATE: string =
`export classs {{classname}} {
    public _value: any;
    private constructor(value: {{typetext}}) {
         this._value = value;
    }
`;  // add methods and a closing brace at the end

const GLOBAL_TEMPLATE: string =
`export class Globals {
{{fns}}
}`;

const GLOBAL_FN_TEMPLATE: string = 
`    {{fnname}}() {
	return {{fnname}}Origin();
    }
`;

const IMPORT_FN_TEMPLATE: string = `{{fnname}} as {{fnname}}Origin`;
const IMPORT_TEMPLATE: string =
`import {
    // foo as fooOrigin
    {{imports}}
} from "./upwork_original";\n\n`;


export class Ts2jsiiUtils {
    union_typename: string;

    capitalizeFirstLetter(str: string): string {
	return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
    }

    findClassNameFromDecl(decl: string): string {
	let m = decl.match(/class +([\S]+)/);
	if (!m) {
	    console.error(`Error: class name is not found in "${decl}"`);
	    return null;
	}
	return m[1];
    }

    // e.g.constructor(name: string, age: number) 
    findCtorSignatureFromDecl(decl: string): string {
	let m = decl.match(/constructor\(([^\)]+)\)/);
	if (!m) {
	    console.error(`Error: class constructor is not found in "${decl}"`);
	    return null;
	}
	return m[1];
    }

    buildCopyClassTemplate(class_decl: string): string {
	let classname = this.findClassNameFromDecl(class_decl);
	let data = {classname: classname};
	let tmpl: any = Handlebars.compile(COPY_CLASS_TEMPLATE);
	// add ctor, method afer this
	return tmpl(data);
    }

    buildCopyClassCtor(decl: string): string {
	let classname = this.findClassNameFromDecl(decl);
	let sig = this.findCtorSignatureFromDecl(decl);
	let params = sig.match(/([\S]+)(?=:)/g).join(', ');
	let data = {constructor_signature: sig, classname: classname, params: params};
	let tmpl: any = Handlebars.compile(COPY_CLASS_CTOR_TEMPLATE);
	return tmpl(data);
    }

    /*
    greet(param: UnionType) {
	console.log(`The parameter is of type ${typeof param}`);
    }
    */
    buildCopyClassMethod(decl: string): string {
	let method_name = decl.match(/^([\S]+)(?=\()/)[1];
	let tmpl: any = Handlebars.compile(COPY_CLASS_METHOD_TEMPLATE);
	let data = {method_name: method_name, union_typename: this.union_typename};
	return tmpl(data);
    }

    buildUnionClassNameFromTypes(text: string): string {
	this.union_typename = text;
	let types: string[] = text.split(/ *\| */);  // remove spaces around |
	let classname: string = this.capitalizeFirstLetter(types[0]);
	let tmpl: any = Handlebars.compile("{{classname}}Or{{typename}}");
    
	for (let i=1; i < types.length; i++) {
	    let data = {classname: classname, typename: this.capitalizeFirstLetter(types[i])};
	    classname = tmpl(data);
	}
	return classname;
    }

    buildClassTemplateForUnionType(classname: string): string {
	let tmpl: any = Handlebars.compile(UNION_CLASS_TEMPLATE);
	let data = {classname: classname, typetext: this.union_typename};
	let union_class_template2: string = tmpl(data);
	return union_class_template2;
    }

    buildMethodsFromTypes(text: string, classname: string): string {
	let types: string[] = text.split(/ *\| */);  // remove spaces around |
	const _tmpl: any =
`    static from{{typename}}(value: {{typename}}): {{classname}} {
         return new {{classname}}(value);
    }`;
	let tmpl: any = Handlebars.compile(_tmpl);
	let methods: string[] = [];

	for (let t of types) {
	    let data = {classname: classname, typename: t};
	    methods.push(tmpl(data));
	}
	return methods.join('\n');
    }

    buildGlobalFnFromFunction(decl: string): string {
	/*
	  e.g. export function globalExample() {
	              console.log("this is a global function");
	      }
	*/
	let m = decl.match(/function +([\S]+)\(/);
	if (!m) {
	    console.error(`Error: function name is not found in "${decl}"`);
	    return null;
	}
	let fnname = m[1]; // function name
	let tmpl: any = Handlebars.compile(GLOBAL_FN_TEMPLATE);
	let data = {fnname: fnname};
	return tmpl(data);
    }
    
    buildGlobalFnDecl(fns: string[]): string {
	let tmpl: any = Handlebars.compile(GLOBAL_TEMPLATE);
	let fns_str: string = fns.join('\n');
	let data = {fns: fns_str};
	return tmpl(data);
    }

    buildImports(import_names: string[]): string {
	let fn_tmpl = Handlebars.compile(IMPORT_FN_TEMPLATE);
	let tmpl: any = Handlebars.compile(IMPORT_TEMPLATE);
	let fns: string[] = [];
	
	for (let fn of import_names) {
	    let imp = fn_tmpl({fnname: fn});
	    fns.push(imp);
	}
	let imp_str: string = fns.join(',\n    ');
	let data = {imports: imp_str};
	return tmpl(data);
    }

};

