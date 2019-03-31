import fs from 'fs';
import path from 'path';
import css from 'css';

import { startGatheringData, startGatheringCss } from './utils';
import { createCssJsSiblingStructure } from './traverse';

//createCssJsSiblingStructure();

let jsFilePath = 'index.js';
let completeJsPath = path.join(__dirname, 'files/ReviewComp', jsFilePath);

let cssFilePath = 'styles.css';
let completeCssPath = path.join(__dirname, 'files/ReviewComp', cssFilePath);

function processJs(){
	return new Promise((resolve, reject) => {
		fs.readFile(completeJsPath, {encoding: 'utf-8'}, function(err, data){
			if(!err){
				resolve(startGatheringData(data));
			} else {
				reject(err);
			}
		});	
	});
}

function processCss(){
	return new Promise((resolve, reject) => {
		fs.readFile(completeCssPath, {encoding: 'utf-8'}, function(err, data){
			if(!err){
				resolve(startGatheringCss(data));
			} else {
				reject(err);
			}
		});	
	});
}

async function start(){
	let cssDataSet = await processCss();
	let jsDataSet = await processJs();
	
	//find styles which are not used in jsx
	let unusedClasses = [];
	for(let i in cssDataSet){
		if(!(i.slice(1) in jsDataSet))
			unusedClasses.push(i.slice(1));
	}

	console.log('Unused classes are');
	console.log(unusedClasses);

	//find classnames for which styles are not defined in css
	let notDefinedClasses = [];
	for(let i in jsDataSet){
		if(!(`.${i}` in cssDataSet))
			notDefinedClasses.push(i);
	}

	console.log('Classes defined in jsx but don\'t have definition in css ');
	console.log(notDefinedClasses);

	//Find empty styles - which have empty body
	let emptyClasses = [];
	for(let i in cssDataSet){
		if(cssDataSet[i] && Object.keys(cssDataSet[i]).length === 0)
			emptyClasses.push(i);
	}

	console.log('Classes in css file with empty bodies ');
	console.log(emptyClasses);
}

start();



