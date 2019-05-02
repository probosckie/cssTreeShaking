import express from 'express';
import socket from 'socket.io';
import path from 'path';
import fs from 'fs';

import { createFullFileName, getContent, findStartEndClassnameParenthesis, processJs, processCss, findLineNumbersForClassInCss } from './utils';
import { isThereACssAsDependencyAt1stLevel, buildDependencyTree, returnAllDependencies } from './traverse';

const app = express();

const server = app.listen(3000);

app.use(express.static(path.join(__dirname, '../client/public')));

const io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
	console.log(`connected to socket ${socket.id}`);
	socket.on('fetchFileSourceJs', getFileSource);
	socket.on('highlightFile', highlightSource);
	socket.on('fixIssues', fixIssues);
	socket.on('saveCssFile', saveCssFile);
	socket.on('fetchAllDependentFiles', getAllDependentFiles)


	async function getFileSource( {filePath} ){
		let tree = buildDependencyTree(filePath);
		let cssDependency;
		let breakup = isThereACssAsDependencyAt1stLevel(tree);

		if ('css' in breakup) {
			cssDependency = breakup.css;
		}
		let fullName = createFullFileName(filePath);
		let content = await getContent(fullName);
		io.sockets.emit('fileSourceJs', content);
		io.sockets.emit('setFullPathJs', fullName); 
		if(cssDependency){
			content = await getContent(cssDependency);
			io.sockets.emit('fileSourceCss', content);
			io.sockets.emit('setFullPathCss', cssDependency);
		}
	}

	async function highlightSource( {filePath} ){
		let fullName = createFullFileName(filePath);

		let content = await getContent(fullName);
		let paren = findStartEndClassnameParenthesis(content);
		io.sockets.emit('highlightedLines', paren);
	}


	async function fixIssues({ js, css }){
		if(js && css){
			let cssDataSet = await processCss(css);
			let jsDataSet = await processJs(js);

			let contentJs = await getContent(js);
			let contentCss = await getContent(css);
			
			//find styles which are not used in jsx
			let unusedClasses = [], unusedClassesLineNumbers = [];
			for(let i in cssDataSet){
				if(!(i.slice(1) in jsDataSet))
					unusedClasses.push(i.slice(1));
			}

			//printing line numbers of unused classes
			unusedClasses.forEach(v => {
				unusedClassesLineNumbers = unusedClassesLineNumbers.concat(findLineNumbersForClassInCss(v, contentCss));
			});

			

			//find classnames for which styles are not defined in css
			/*let notDefinedClasses = [];
			for(let i in jsDataSet){
				if(!(`.${i}` in cssDataSet))
					notDefinedClasses.push(i);
			}*/

			//Find empty styles - which have empty body
			let emptyClasses = [], emptyClassesLineNumbers = [];
			for(let i in cssDataSet){
				if(cssDataSet[i] && Object.keys(cssDataSet[i]).length === 0)
					emptyClasses.push(i.slice(1));
			}

			emptyClasses.forEach(v => {
				emptyClassesLineNumbers = emptyClassesLineNumbers.concat(findLineNumbersForClassInCss(v, contentCss));
			});

			
			if(unusedClassesLineNumbers.length){
				io.sockets.emit('unusedClassesCss', unusedClassesLineNumbers);
			}


			if(emptyClassesLineNumbers.length){
				io.sockets.emit('emptyClassesCss', emptyClassesLineNumbers);
			}
		}
	}


	async function saveCssFile(obj){
		fs.writeFile(obj.name, obj.value, (err) => {
			console.log('file is saved - check bete');
			io.sockets.emit('cssFileSaved', 'success');
		})
	}


	async function getAllDependentFiles(fileName){
		let dep = await returnAllDependencies(fileName);
		io.sockets.emit('allDependencies', dep);
	}
}
