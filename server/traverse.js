import dT from 'dependency-tree';
import path from 'path';
import fs from 'fs';

import { createFullFileName } from './utils';

//This is the starting point which can change - change it to some other container file.
let jsFilePath = 'index.js';
let pathToContainer = '../files/ReviewComp/';
let completeJsPath = path.join(__dirname, pathToContainer, jsFilePath);

//Don't change this part - this is the path which contains all the files
let dirPath = path.join(__dirname, '../files/src');
let identifyJsFiles = /\.js/
let identifyCssFiles = /\.css/

export function isThereACssAsDependencyAt1stLevel(obj){
	let key = obj && Object.keys(obj);
	if(key && key.length === 1) {
		key = key[0];
		let isKeyValidJS = identifyJsFiles.test(key);
		if(!isKeyValidJS)
			return false;
		let validCssFileName = false;
		let resultingObject = obj[key];
		if(resultingObject && Object.keys(resultingObject).length === 0)
			return false;

		for(let i in resultingObject){
			if(identifyCssFiles.test(i)){
				validCssFileName = i
			}
		}

		if(validCssFileName){
			return {
				js:key,
				css:validCssFileName  
			};
		} else
			return false;
	}
	return false;
}

function findCompleteJsCssPairs(obj) {
	let allPairs = [];
	let distinctPairs = {};

	function traverseTree(o){
		let isEmptyObject = (Object.getPrototypeOf(o) === Object.prototype) && Object.keys(o).length == 0;

		if (isEmptyObject)
			return;

		let initial = isThereACssAsDependencyAt1stLevel(o);


		if(initial && !(initial.js in distinctPairs)) {
			distinctPairs[initial.js] = true;
			allPairs.push(initial);
		}

		let key = Object.keys(o)[0];
		let values = o[key];


		for(let i in o[key]){
			let newObj = {};
			newObj[i] = o[key][i];
			traverseTree(newObj);
		}
	}

	traverseTree(obj);
	return allPairs;
}

export function buildDependencyTree(completeFilePath, completeDirPath) {
	if(!completeDirPath)
		completeDirPath = path.join(__dirname, 'files');

	return dT({
		filename: completeFilePath,
		directory: completeDirPath
	});
}


export function returnAllDependencies(fn, dirPath){
	let absFilePath = createFullFileName(fn);
	
	if(!dirPath)
		dirPath = path.join(__dirname, '../files');


	let tree = dT({
		filename: absFilePath,
		directory: dirPath
	});
	//console.log(JSON.stringify(tree));
	if(tree)
		return findCompleteJsCssPairs(tree);
	return [];

}

export function createCssJsSiblingStructure(){
	let tree = dT({
		filename: completeJsPath,
		directory: dirPath
	});
	let writingString = findCompleteJsCssPairs(tree);
	fs.writeFile("listofFiles.txt", writingString, function(err) {
	  if(err) {
	    return console.log(err);
	  }
	  console.log("The file was saved!");
	});
}
