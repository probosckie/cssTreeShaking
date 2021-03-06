import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { getContent, writeToFile } from './utils';


let pathToCssDump = '../cssSmall.json';
let pathToLastLeft = '../lastLeft.json';
let result = '../result.css';

let resultJson = '../cssResult.json';

pathToCssDump = path.join(__dirname, pathToCssDump);
pathToLastLeft = path.join(__dirname, pathToLastLeft);
result = path.join(__dirname, result);

resultJson = path.join(__dirname, resultJson);


function createNames() {
	async function x(){
		let cssDump, lastLeftKey, existing;
		cssDump = await getContent(pathToCssDump);
		cssDump = JSON.parse(cssDump);

		lastLeftKey = await getContent(pathToLastLeft);
		lastLeftKey = JSON.parse(lastLeftKey);

		existing = await getContent(result);

		let resultJsonString = await getContent(resultJson);

		resultJsonString = JSON.parse(resultJsonString);

		let keys = Object.keys(cssDump);

		const rl = readline.createInterface(process.stdin, process.stdout);

		let currentPropertyIndex = 0, currentValueIndex = 0, classString = '', set;

		if(existing && existing.length){
			classString = existing;
			currentPropertyIndex = lastLeftKey.lastPropertyIndex;
			currentValueIndex = lastLeftKey.lastStyleIndex;
		}


		set = Object.keys(cssDump[keys[currentPropertyIndex]]);

		rl.setPrompt(`Press abort to abort \n s to skip property \n Give className for Property: ${keys[currentPropertyIndex]} \n Value: ${set[currentValueIndex]}\n Count: ${cssDump[keys[currentPropertyIndex]][set[currentValueIndex]]} \n  `);
		rl.prompt();
		rl.on('line', function(line) {
	    if (line === "abort") 
	    	rl.close();
	    else {
	    	if(line !== 's'){
	    		classString += `.${line} { \n ${keys[currentPropertyIndex]} : ${set[currentValueIndex]} \n}\n`;
	    		if(!(keys[currentPropertyIndex] in resultJsonString)){
	    			resultJsonString[keys[currentPropertyIndex]] = {};
	    		} 
	    		resultJsonString[keys[currentPropertyIndex]][set[currentValueIndex]] = line;
	    	}
	    }

	    currentValueIndex = currentValueIndex + 1;

	    if(currentValueIndex === set.length){
	    	currentPropertyIndex = currentPropertyIndex + 1;

	    	//if we reached end of json
	    	if(currentPropertyIndex === keys.length)
	    		rl.close();

	    	currentValueIndex = 0;
	    	set = cssDump[keys[currentPropertyIndex]] && Object.keys(cssDump[keys[currentPropertyIndex]]);
	    }
	    if(set){
	    	rl.setPrompt(`Press abort to abort \n s to skip property \n Give className for Property: ${keys[currentPropertyIndex]} \n Value: ${set[currentValueIndex]}\n Count: ${cssDump[keys[currentPropertyIndex]][set[currentValueIndex]]} \n`);
	    	rl.prompt();	
	    }
		}).on('close', function(){
		    writeToFile(result, classString);
		    writeToFile(pathToLastLeft, JSON.stringify({
		    	lastPropertyIndex: currentPropertyIndex,
		    	lastStyleIndex: currentValueIndex
		    }));

		    writeToFile(resultJson, JSON.stringify(resultJsonString));
		});	
	}
	x();
}

createNames();
