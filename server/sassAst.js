import fs from 'fs';
import path from 'path';
import pc from 'postcss'
import { getContent, writeToFile, returnAllDistinctCssProps } from './utils';


let fileName = '../files/styles2.css';

//let writeFile = '../ast.json';


fileName = path.join(__dirname, fileName);
//writeFile = path.join(__dirname, writeFile);

let p = [];


function extractCssProp(obj, acc){
	if(!(obj.prop in acc)){
		acc[obj.prop] = {
			[obj.value] : 1
		};
	} else {
		if(!(obj.value in acc[obj.prop])){
			acc[obj.prop][obj.value] = 1;
		} else {
			acc[obj.prop][obj.value] = (acc[obj.prop][obj.value] + 1);
		}
	}
}


function decorateCss(seed, acc = {}){
	if(seed.nodes && seed.nodes.length){
		seed.nodes.forEach(v => {
			if(v.type === 'decl')
				extractCssProp(v, acc);
			else if(v.type === 'rule')
				decorateCss(v, acc);
		});
	}
}


getContent(fileName).then(v => {
	//let x = {};
	//returnAllDistinctCssProps(v, x);
	//console.log(x);

	let rule = pc.parse(v);
	//const rule = parsed;
	let allRules = rule.nodes;
	let allCss = {};
	allRules.forEach(v => {
		if(v.type === 'rule' || v.type === 'atrule') {
			decorateCss(v, allCss);
		}
	});
	console.log(allCss);

	/*for (const decl of rule.nodes) {
		p.push(decl);
		//console.log(Object.keys(decl));
		//console.log(decl.prop);
	}*/
	//writeToFile(writeFile, JSON.stringify(p));
})






