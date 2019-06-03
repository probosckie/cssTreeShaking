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


function isClassNamePresentInSelectorString(className, selectorString){
	let isMany = selectorString.includes(',');
	if(isMany)
		

}

function findClassLevel(selectorName, root){
	let level = 0;

	function recurseFind(seed, level){
		if(seed.selector && seed.selector === selectorName)
	}

	recurseFind(root, 0);
}

function isClassInSassBlock(c, tree){

}

function isClassSplittable(className, postCssTree) {
	let isSplittable = true;

	isSplittable = !isClassInSassBlock(className, postCssTree);

	if(!isSplittable)
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
	console.log('Is class in sass block');
	console.log(isClassSplittable('filterHeading', pcTree));
}


//test();
start();


