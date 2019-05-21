import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { getContent, writeToFile } from './utils';


let pathToCssDump = '../cssSmall.json';
let pathToLastLeft = '../lastLeft.json';
let result = '../result.css';

pathToCssDump = path.join(__dirname, pathToCssDump);
pathToLastLeft = path.join(__dirname, pathToLastLeft);
result = path.join(__dirname, result);


function createNames() {
	async function x(){
		let cssDump, lastLeftKey;
		cssDump = await getContent(pathToCssDump);
		cssDump = JSON.parse(cssDump);

		lastLeftKey = await getContent(pathToLastLeft);
		lastLeftKey = JSON.parse(lastLeftKey);

		lastLeftKey = lastLeftKey["lastLeft"];

		let keys = Object.keys(cssDump);

		const rl = readline.createInterface(process.stdin, process.stdout);
		let collect = '', classString = '';

		let currentPropertyIndex = 0, currentValueIndex = 0, set = Object.keys(cssDump[keys[currentPropertyIndex]]);

		rl.setPrompt(`Press abort to abort \n Give className for Property: ${keys[currentPropertyIndex]} \n Value: ${set[currentValueIndex]}\n`);
		rl.prompt();
		rl.on('line', function(line) {
	    if (line === "abort") 
	    	rl.close();
	    else {
	    	classString += `.${line} { \n ${keys[currentPropertyIndex]} : ${set[currentValueIndex]} \n } \n`;
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
	    	rl.setPrompt(`Press abort to abort \n Give className for Property: ${keys[currentPropertyIndex]} \n Value: ${set[currentValueIndex]}\n`);
	    	rl.prompt();	
	    }
		}).on('close', function(){
		    writeToFile(result, classString);
		    //process.exit(0);
		});	
	}

	x();
}

createNames();
