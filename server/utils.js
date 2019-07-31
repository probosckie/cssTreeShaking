import fs from 'fs';
import path from 'path';
import dT from 'dependency-tree';
import css from 'css';
import pc from 'postcss';

export let classNameRegex = /className\s*=\s*{/;


function isEndOfClassName(str){
	if(str === '}')
		return -1;
	if(str === '{')
		return 1;
	return str === ' ' || str === ',' || str === ']' || str === ':' || str === ')';
}

export function isAbsoluteEndOfClassName(str){
	return str === ' ' || str === ',' || str === ']' || str === ':' || str === ')' || str === '{' || str === '}'  || !str || str === '\t';
}

export function isStartOrEndOfClass(str){
	return str === '[' || str === ' ' || str === ',' || str === ']' || str === ':' || str === ')' || str === '{' || str === '}'  || !str || str === '\t' || str === '(';
}

export function isAlphaBetic(f){
	return (f >= 'a' && f <= 'z') || (f >= 'A' && f <= 'Z')
}

export function isClassPartOfComplexString(str){
	return str === ' ' || str === ']' || str === '[' ||str === ':' || str === ')' || str === '>' || str === '<' || str === '\t' || str == '.' || str === '#';
}


function findMultipleOccurencesOf(v) {
	let occurrencesInLine=[], found, oldLength = 0, newStr;
	do {
		newStr = v.slice(oldLength);
		found = classNameRegex.exec(newStr);
		if(found){
			occurrencesInLine.push(oldLength + found.index + found[0].length - 1);
			oldLength = oldLength + found.index + found[0].length;
		}
	} while(found);
	return occurrencesInLine;
}

function matchCssObjectRef(str, i, s_ka_replacement){
	let charBeforeTest = isStartOrEndOfClass(str[i-1]);
	if(!charBeforeTest)
		return false;

	for(let j = 0; j < s_ka_replacement.length; j++){
		if(str[i] !== s_ka_replacement[j])
			return false;
		i++;
	}
	if(str[i] !== '.')
		return false;

	return true;
}

export function findClassesFromLine(str, is_S_used, s_ka_replacement) {
	let classes = {}, i, find, newStr, temp, increment;
	for(i = 0; i < str.length;){
		increment = false;

		/*if(str[i] === 's' && str[i+1] === '.' && isStartOrEndOfClass(str[i-1])){*/
		if(matchCssObjectRef(str, i, s_ka_replacement)){
			i += 2;
			increment = true;
			temp = '';
			while(!isStartOrEndOfClass(str[i])){
				temp += str[i];
				i++;
			}
			classes[temp] = true;
		}

		if(!increment)
			i++;
	}
	return classes;
}

export function extractAllClasses(lines, is_S_used = true, s_ka_replacement = 's') {
	if(!Array.isArray(lines))
		lines = lines.split('\n');
	let test;
	let allClasses = {}, temp;
	let completeStrings = [], appendMode = false, bracketCount = 0, i = -1;
	let foundPerLine;

	lines.forEach(v => {
		//find all occurences of the regex in line
		test = findMultipleOccurencesOf(v);
		foundPerLine = 0;
		if(test.length || appendMode){
			for(let charLoop = 0; charLoop < v.length; charLoop++){
				if(appendMode){
					//add everything except the last }
					if(!(bracketCount == 1 && v[charLoop] == '}')){
						completeStrings[i] += v[charLoop];
					}
				}

				if(v[charLoop] === '{'){
					if(test.length && charLoop === test[foundPerLine]){
						//this is because of a encounter with a regex match and we're on the starting parenthesis
						foundPerLine++;
						bracketCount++;
						appendMode = true;
						i++;
						completeStrings[i] = '';
					} else {
						bracketCount++;	
					}
				}
				if(v[charLoop] === '}') {
					//check here if the bracketCount = 1 - which will make this the end of the current line
					if(bracketCount == 1){
						appendMode = false;
						bracketCount = 0;
					} else
						bracketCount--;
				}
			}	
		}
	});
	//console.log('all strings are', completeStrings);
	completeStrings.forEach(v => {
		temp = findClassesFromLine(v, is_S_used, s_ka_replacement);
		allClasses = Object.assign({}, allClasses, temp);
	});

	return allClasses;
}


function extractClassnamesParenthesisRange(v, rangeParenthesis, lineNum) {
	let found, startOfParenthesis = 0, parenthesisCount, test, oldLength = 0;
	let globalIndex;
	let findAll = [];
	do {
		test = classNameRegex.test(v);
		found = classNameRegex.exec(v);
		if(found && found.index) {
			found = found.index;
			startOfParenthesis = found + 10;
			parenthesisCount = 1;
			startOfParenthesis += 1;
			findAll[findAll.length] = startOfParenthesis +  oldLength;
			while(parenthesisCount > 0 && startOfParenthesis < v.length){
				if(v[startOfParenthesis] === '{')
					parenthesisCount++;
				if(v[startOfParenthesis] === '}')
					parenthesisCount--;
				if(v[startOfParenthesis] === 's' && v[startOfParenthesis+1] === '.' && !isAlphaBetic(v[startOfParenthesis - 1])) {
					let classString = '';
					startOfParenthesis += 2;
					let classStringEnd;
					do {
						classStringEnd = isEndOfClassName(v[startOfParenthesis]);
						if(classStringEnd === 1 || classStringEnd === -1){
							parenthesisCount += classStringEnd;
							classStringEnd = true;
						} else if(!classStringEnd) {
							classString += v[startOfParenthesis];
						}
						startOfParenthesis++;
					} while(!classStringEnd);
					
				} else {
					startOfParenthesis++;	
				}
			}
			findAll[findAll.length] = (startOfParenthesis + oldLength);
			oldLength += (startOfParenthesis);
			v = v.slice(startOfParenthesis);
		}
	} while(test);
	rangeParenthesis[lineNum] = findAll;
}


export function findStartEndClassnameParenthesis(content) {
	let rangeParenthesis = { }, lines = content.split('\n');
	let test;
	let linesToInspect = lines.filter(v => classNameRegex.test(v));
	lines.forEach((v,i) => {
		test = classNameRegex.test(v);
		if(test)
			extractClassnamesParenthesisRange(v, rangeParenthesis, i);
	});
	return rangeParenthesis;
}

function extractAndCopyProps(selector, allRules, cssObject) {
	let newObj;
	if(!(selector in allRules)){
		newObj = {};
		cssObject.declarations.forEach(v => {
			newObj[v.property] = v.value;
		});
		allRules[selector] = newObj;
	} else {
		newObj = allRules[selector];
		cssObject.declarations.forEach(v => {
			newObj[v.property] = v.value;
		});
		allRules[selector] = newObj;
	}
}

function copyCssPropToObj(obj, cssPropSet){
	if(cssPropSet && cssPropSet.declarations){
		cssPropSet.declarations.forEach(v => {
			if(!(v.property in obj)){
				obj[v.property] = {};
				obj[v.property][v.value] = 1;
			} else { 
				if(v.value in obj[v.property])
					obj[v.property][v.value] = obj[v.property][v.value] + 1;
				else
					obj[v.property][v.value] = 1;
			}
		});
	}
}

export function returnAllStyles(fileContent, fName){
	try {
		let parsedCss = css.parse(fileContent);
		let rules = {};
		let sheet = parsedCss.stylesheet;
		return sheet;	
	}
	catch(e){
		console.log('Exception happened');
		console.log(JSON.stringify(e));
		console.log(`for fileName: ${fName}`)
	}
	
}

export function returnAllDistinctCssProps(fileContent, accumulator = {}){
	let parsedCss = css.parse(fileContent);
	let sheet = parsedCss.stylesheet;
	sheet.rules.filter(v => v.type === 'rule').forEach(v => {
		copyCssPropToObj(accumulator, v);
	});
}


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

export async function getAllCssRules(fileName, accumulator = {}){
	let content = await getContent(fileName);
	let rule = pc.parse(content);
	let allRules = rule.nodes;
	allRules.forEach(v => {
		if(v.type === 'rule' || v.type === 'atrule') {
			decorateCss(v, accumulator);
		}
	});
}



export function startGatheringCss(fileContent) {
	let parsedCss = css.parse(fileContent);
	//the key value will be a selector and the value will be an object containing a list of the properties with overrides
	let rules = {};
	let sheet = parsedCss.stylesheet;
	sheet.rules.filter(v => v.type === 'rule').forEach(v => {
		if(v.selectors && v.selectors.length){
			v.selectors.forEach(j => extractAndCopyProps(j, rules, v))
		}
	});
	return rules;
}

export function createFullFileName(filePath) {
	if(filePath[0] !== '/')
		return path.join(__dirname, '../files', filePath);
	else
		return filePath;
}


export function getContent(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, {encoding: 'utf-8'}, function(err, data){
			if(!err){
				resolve(data);
			} else {
				reject(err);
			}
		});	
	});
}

export function processJs(fn){
	return new Promise((resolve, reject) => {
		fs.readFile(fn, {encoding: 'utf-8'}, function(err, data){
			if(!err){
				resolve(extractAllClasses(data));
			} else {
				reject(err);
			}
		});	
	});
}

export function processCss(fn){
	return new Promise((resolve, reject) => {
		fs.readFile(fn, {encoding: 'utf-8'}, function(err, data){
			if(!err){
				resolve(startGatheringCss(data));
			} else {
				reject(err);
			}
		});	
	});
}


export function findLineNumbersForClassInCss(className, content) {
	let lines = content.split('\n');
	let lineNumbers = [];

	let lengthOfClass = className.length + 1;

	let regex = new RegExp("\."+className);

	lines.forEach((v,i) => {
		if(regex.test(v)){
			let lcm = regex.exec(v);
			if(lcm && isAbsoluteEndOfClassName(v[lcm.index + lengthOfClass])){
				lineNumbers.push(i);
			}
		}
	});
	return lineNumbers;
}

export function findLineNumbersForClassInJs(className, content) {
	let lines = content.split('\n');
	let lineNumbers = [];
	let lengthOfClass = className.length + 1;

	let regex = new RegExp("s\."+className);

	lines.forEach((v,i) => {
		if(regex.test(v)){
			let lcm = regex.exec(v);
			if(lcm && isAbsoluteEndOfClassName(v[lcm.index + lengthOfClass + 1])){
				lineNumbers.push(i+1);
			}
		}
	});
	return lineNumbers;
}


export function getCssFileName(fn){
	let result = fn.split('/');
	return result[result.length - 1] || '';
}

export function findCssReferenceObjectName(line, cssFn){
	let test = new RegExp(cssFn);
	if(test.exec(line)){
		let indexImport = line.indexOf('import') + 6;
		let indexFrom = line.indexOf('from');
		return line.slice(indexImport, indexFrom).trim();
	}
	return false;
}


export function writeToFile(pathToJsFile, data){
	fs.writeFile(pathToJsFile, data, (err) => {
		console.log('the file is written');
	});
}
