import dT from 'dependency-tree';
import path from 'path';
import fs from 'fs';

//This is the starting point which can change - change it to some other container file.
let jsFilePath = 'index.js';
let pathToContainer = 'files/ReviewComp';
let completeJsPath = path.join(__dirname, pathToContainer, jsFilePath);

//Don't change this part - this is the path which contains all the files
let dirPath = path.join(__dirname, 'files');
let identifyJsFiles = /\.js/
let identifyCssFiles = /\.css/

function isThereACssAsDependencyAt1stLevel(obj){
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

	function traverseTree(o){
		let isEmptyObject = (Object.getPrototypeOf(o) === Object.prototype) && Object.keys(o).length == 0;

		if (isEmptyObject)
			return;

		let initial = isThereACssAsDependencyAt1stLevel(o);


		if(initial) {
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