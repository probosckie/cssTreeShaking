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
		let isAtRule = seed.type === 'atrule' && seed.name === 'media';

		if(!isAtRule){
			if(seed.selector){
				result = isClassNamePresentInSelectorString(selectorName, seed.selector);
				if(result && level > leafLevel){
					leafLevel = level;
				}
			}
			if(seed.nodes){
				seed.nodes.forEach(v => recurseFind(v, level+1));
			}	
		}		
	}

	recurseFind(root, 0);
	return leafLevel;
}

function findClassInMQ(c, root){
	let isFoundInMediaQuery = false;

	function recurseFind(seed, isInsideMedia){
		let result;
		let isAtRule = seed.type === 'atrule' && seed.name === 'media';	
		if(seed.selector){
			result = isClassNamePresentInSelectorString(c, seed.selector);
			if(result && isInsideMedia){
				isFoundInMediaQuery = true;
			}
		}
		if(seed.nodes){
			seed.nodes.forEach(v => recurseFind(v, isInsideMedia || isAtRule));
		}	
	}
	recurseFind(root, false);
	return isFoundInMediaQuery;
}



function isClassInSassBlock(c, tree){
	let leafLevel = findMaxClassLevel(c, tree);

	
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
	
	if(isSplittable)
		return false;
	
	isSplittable = findClassInMQ(className, postCssTree);

	//console.log('found in media query' +  isSplittable);

	if(isSplittable)
		return false;
	else
		console.log('Class is not in sass block and media query -  only name test remaining');
	/*
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
	//await writeToFile(writeCssFile, JSON.stringify(modified));
	//console.log('file written');
}


function test(){
	//let cssContent = await getContent(writeCssFile);
	//let rule = pc.parse(cssContent);
	console.log('Is class splittable ??');
	console.log(isClassSplittable('filterHeading', pcTree));
}


//test();
//start();


function isClassnamePartOfComplexSelectorRule(className, selector) {
	selector = selector.trim();
	let charlastTest, test, match, charStartTest;

	test = false;

	for(;;){
		match = selector.indexOf(className);

		if(match == -1)
			break;

		charlastTest = selector[match + className.length];
		if(match !== 0){
			charStartTest = selector[match - 1];
			test = isClassPartOfComplexString(charStartTest)
			if(test)
				break;
		}

		test = isClassPartOfComplexString(charlastTest);

		if(test)
			break;

		selector = selector.substring(match + className.length);
		
		if(selector === '')
			break;
	}
	return test;
}

let className = '.d', selectorName = '.abcd:nth-child(1) .d.a';

console.log('is '+className + ' a part of complex selector Rule : '+ selectorName);
console.log(isClassnamePartOfComplexSelectorRule(className,selectorName));

