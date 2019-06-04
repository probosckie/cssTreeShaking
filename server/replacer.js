/*
This script will be able to replace direct css and present choices to user via a WS ui.
*/



import fs from 'fs';
import path from 'path';
import pc from 'postcss'
import { getContent, writeToFile, extractAllClasses, getAllCssRules } from './utils';


let jsFile = '../files/src/components/Bus/BusReviews/index.js';
let cssFile = '../files/sassStyles.css';

let pcTree;

let writeCssFile = '../postcssMapping.json';
writeCssFile = path.join(__dirname, writeCssFile);


jsFile = path.join(__dirname, jsFile);
cssFile = path.join(__dirname, cssFile);


function isClassNamePresentInSelectorString(className, selectorString) {
	className = '.' + className;
	for(let v of selectorString.split(',')){
		if(v.trim() === className)
			return true;
	}
	return false;
}

function findMaxClassLevel(selectorName, root){
	let leafLevel = -1;
	function recurseFind(seed, level){
		let result;
		if(seed.selector){
			result = isClassNamePresentInSelectorString(selectorName, seed.selector);
			if(result && level > leafLevel){
				leafLevel = level;
				console.log('changed!');
			}
		}
		if(seed.nodes){
			seed.nodes.forEach(v => recurseFind(v, level+1));
		}
	}

	recurseFind(root, 0);
	return leafLevel;
}

function isClassInSassBlock(c, tree){
	let leafLevel = findMaxClassLevel(c, tree);

	//console.log('found at level ' + leafLevel);
	if(leafLevel === 1)
		return false;


	if(leafLevel === -1)
		return 'notFound';

	return true;
}

function isClassSplittable(className, postCssTree) {
	let isSplittable = true;

	isSplittable = isClassInSassBlock(className, postCssTree);

	if(isSplittable === 'notFound')
		return false;
	
	else if(isSplittable)
		return false;
	else
		return true;

	//code this later
	/*isSplittable = !isClassInMediaQuery(className, postCssTree);

	if(!isSplittable)
		return false;

	isSplittable = !isClassComplexSelector(className, postCssTree);

	return isSplittable;*/
}


async function start(){
	let jsContent = await getContent(jsFile);
	//console.log(jsContent);
	let lines = jsContent.split('\n');
	let classes = extractAllClasses(lines, true, 's');
	/*if(classes)
		classes = Object.keys(classes);
	console.log(classes);*/
	let cssContent = await getContent(cssFile);
	let rule = pc.parse(cssContent);
	/*let modified = rule.nodes.map(v => {
		if(v.raws)
			delete v.raws;
		if(v.source)
			delete v.source;
		if(v.nodes) {
			v.nodes = v.nodes.map(v1 => {
				if(v1.raws)
					delete v1.raws;
				if(v1.source)
					delete v1.source;
				return v1;
			});
		}
		return v;
	});*/

	pcTree = rule;
	test();
	//await writeToFile(writeCssFile, JSON.stringify(rule));
	//console.log('file written');
}


function test(){
	//let cssContent = await getContent(writeCssFile);
	//let rule = pc.parse(cssContent);
	console.log('Is class splittable');
	console.log(isClassSplittable('filterHeading', pcTree));
}


//test();
start();


