/*
	We will target a sample file and replace 2-3 lines with something else and then write it back into the file
	 in the cleanest possible way - in a way that I can even let git detect those changes.
*/

import fs from 'fs';
import path from 'path';
import { getContent } from './utils';


let pathToJsFile = 'files/index-test.js';
pathToJsFile = path.join(__dirname, pathToJsFile);


/*fs.readFile(pathToJsFile, 'utf8', function (err, data) {
  if (err) 
  	throw err;
  console.log(data);
});*/

getContent(pathToJsFile).then((d) => {
	let lines = d.split('\n');
	lines[1] = 'here is some new content';
	let newContent = lines.join('\n');

	fs.writeFile(pathToJsFile, newContent, (err) => {
		console.log('the file is modifiled');
	})

}).catch(e => console.log(e))

