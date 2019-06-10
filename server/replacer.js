/*
This script will be able to replace direct css and present choices to user via a WS ui.
*/
import fs from 'fs';
import path from 'path';
import pc from 'postcss'
import { getContent, writeToFile, extractAllClasses, getAllCssRules, isClassPartOfComplexString } from './utils';


let jsFile = '../files/src/components/Bus/BusReviews/index.js';
let cssFile = '../files/sassStyles.css';

let pcTree;

let writeCssFile = '../postcssMapping.json';
writeCssFile = path.join(__dirname, writeCssFile);


jsFile = path.join(__dirname, jsFile);
cssFile = path.join(__dirname, cssFile);

function isClassNamePresentInSelectorString(className, selectorString) {
	className = '.' + className;
	let exactMatchTest = false, complexSelectorTest = false;
	let result = {
		exactMatchTest : false,
		complexSelectorTest:  false 
	}

	for(let v of selectorString.split(',')){
		exactMatchTest = (v.trim() === className);
		complexSelectorTest = isClassnamePartOfComplexSelectorRule(className, v.trim());
		if(complexSelectorTest){
			result.complexSelectorTest = true;
		}
		if(exactMatchTest){
			result.exactMatchTest = true;
		}
	}
	if(!result.exactMatchTest && !result.complexSelectorTest)
		return false;

	return result;
}

//let c1 = '.filterHeading', c2 = '.filterHeading';
//console.log(` Is class ${c1} part of the complex selector rule ${c2}`);
//console.log(isClassnamePartOfComplexSelectorRule(c1, c2));



function isClassnamePartOfComplexSelectorRule(className, selector) {
	let charlastTest, test, match, charStart;
	
	test = false;

	for(;;){
		match = selector.indexOf(className);

		if(match == -1)
			break;

		charlastTest = selector[match + className.length];
		test = isClassPartOfComplexString(charlastTest);

		if(match !== 0) {
			charStart = selector[match - 1];
			if(!charlastTest || test){
				if(isClassPartOfComplexString(charStart) || !!charStart){
					test = true;
					break;
				}
			}
		}

		if(test)
			break;

		selector = selector.substring(match + className.length);
		
		if(selector === '')
			break;
	}
	return test;
}


function recurseFindComplex(c, tree){
	let isComplex = false, isFound = false, isMedia = false;
	let leafLevel = -1;

	function recurseFind(selectorName, seed, isM, level){
		let isAtRule = seed.type === 'atrule' && seed.name === 'media', result;
		if(seed.selector){
			result = isClassNamePresentInSelectorString(selectorName, seed.selector);
			if(result.complexSelectorTest)
				isComplex = true;
			if(result){
				isFound = true;
				if(isM)
					isMedia = true;
				if(level > leafLevel)
					leafLevel = level;
			}
		}

		if(seed.nodes && !isComplex){
			seed.nodes.forEach(v => recurseFind(selectorName, v, isAtRule || isM, level+1));
		}
	}
	recurseFind(c, tree, false, 0);

	//if it is a complex selector or in a nested sass or in a media query or not found - then not splittable
	if(isComplex || leafLevel > 1 || isMedia || !isFound)
		return false;

	return true;
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
	//await writeToFile(writeCssFile, JSON.stringify(modified));
	//console.log('file written');
}


function test(){
	//let cssContent = await getContent(writeCssFile);
	//let rule = pc.parse(cssContent);
	console.log('Is class splittable ??');
	console.log(recurseFindComplex('filterHeading', pcTree));
}


//test();
start();

