import fs from 'fs';
import path from 'path';
import dT from 'dependency-tree';
import css from 'css';

let classNameRegex = /className=\{/;

function isEndOfClassName(str){
	if(str === '}')
		return -1;
	if(str === '{')
		return 1;
	return str === ' ' || str === ',' || str === ']' || str === ':' || str === ')';
}

function isAbsoluteEndOfClassName(str){
	return str === ' ' || str === ',' || str === ']' || str === ':' || str === ')' || str === '{' || str === '}';
}

function isAlphaBetic(f){
	return (f >= 'a' && f <= 'z') || (f >= 'A' && f <= 'Z')
}


function extractClassnamesfromString(v, allClassNames){
	let found, startOfParenthesis, parenthesisCount, test;
	let globalIndex;
	do {
		test = classNameRegex.test(v);
		found = classNameRegex.exec(v);
		if(found && found.index) {
			found = found.index;
			startOfParenthesis = found + 10;
			parenthesisCount = 1;
			startOfParenthesis += 1;
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
					allClassNames[classString] = true;
				} else {
					startOfParenthesis++;	
				}
			}
			v = v.slice(startOfParenthesis);
		}
	} while(test);
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


export function startGatheringData(fileContent){
	let allClassNames = {};
	let lines = [''], currentIndex=0;
	for(var i = 0; i < fileContent.length; i++){
		if(fileContent[i] === '\n'){
			currentIndex++;
			lines.push('');
		} else {
			lines[currentIndex] = lines[currentIndex] + fileContent[i];
		}
	}

	let linesToInspect = lines.filter(v => classNameRegex.test(v));
	//linesToInspect = linesToInspect.slice(0,8);
	linesToInspect.forEach(v => {
		extractClassnamesfromString(v, allClassNames);
	});
	return allClassNames;
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
		return path.join(__dirname, filePath);
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
				resolve(startGatheringData(data));
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


/*export function findLineNumbersForClassInJs(className, content) {
	let lines = content.split('\n');
	let lineNumbers = [];

	let lengthOfClass = className.length + 1;

	let regex = new RegExp("\."+className);
s
	lines.forEach((v,i) => {
		if(regex.test(v))
			lineNumbers.push(i);
	});
}*/



