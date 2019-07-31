import express from 'express';
import socket from 'socket.io';
import path from 'path';
import fs from 'fs';

import { createFullFileName, getContent, findStartEndClassnameParenthesis, processJs, processCss, findLineNumbersForClassInCss, findLineNumbersForClassInJs } from './utils';
import { isThereACssAsDependencyAt1stLevel, buildDependencyTree, returnAllDependencies } from './traverse';
import { processCssBreakdown, cssPruning } from './replacer';
import { findClassLineNumbersInCss } from './sassAst';

const app = express();

const server = app.listen(3051);

app.use(express.static(path.join(__dirname, '../client/public')));

const io = socket(server);

let newBase = '/Users/Prabhas/code/consumer-web-bus/src';

io.sockets.on('connection', newConnection);

function calcFileSize(x){
	let s = fs.statSync(x);
	if(s)
		return s.size;
}

function newConnection(socket) {
	console.log(`connected to socket ${socket.id}`);
	socket.on('fetchFileSourceJs', getFileSource);
	socket.on('highlightFile', highlightSource);
	socket.on('fixIssues', fixIssues);
	socket.on('saveCssFile', saveCssFile);
	socket.on('saveJsFile', saveJsFile);
	socket.on('fetchAllDependentFiles', getAllDependentFiles);
	socket.on('passD', passD);
	socket.on('fetchBreakableClassList', createCssBreakdown);
	socket.on('findClassLineNumbers', findClassInSrc)


	async function createCssBreakdown(data){
		let trybreakdown = processCssBreakdown(data.jsfilePath, data.cssFilePath, data.jsPaneContent, data.cssPaneContent);

		trybreakdown.then(v => {
			io.sockets.emit('cssBreakdown', v);
		});
	}

	async function getFileSource( {filePath} ){
		let tree = buildDependencyTree(filePath);
		let cssDependency;
		let jsSize = '', cssSize = '';
		let breakup = isThereACssAsDependencyAt1stLevel(tree);
		if ('css' in breakup) {
			cssDependency = breakup.css;
		}
		let fullName = createFullFileName(filePath);
		jsSize = calcFileSize(fullName);
		let content = await getContent(fullName);
		

		io.sockets.emit('fileSourceJs', content);
		io.sockets.emit('setFullPathJs', fullName);
		io.sockets.emit('fileSizeJs', {
			filePath: fullName,
			originalSize: jsSize
		});

		cssSize = calcFileSize(cssDependency);
		


		if(cssDependency){
			content = await getContent(cssDependency);
			io.sockets.emit('fileSourceCss', content);
			io.sockets.emit('setFullPathCss', cssDependency);
			io.sockets.emit('fileSizeCss', {
				filePath: cssDependency,
				originalSize: cssSize
			});
		}
	}


	async function passD( data ){
		console.log('got data', data);
		//io.sockets.emit('fileSourceCss', content);
		io.sockets.emit('sendRData', 'response from data');
		
	}




	async function highlightSource( {filePath} ){
		let fullName = createFullFileName(filePath);

		let content = await getContent(fullName);
		let paren = findStartEndClassnameParenthesis(content);
		io.sockets.emit('highlightedLines', paren);
	}


	async function fixIssues({ js, css }){
		if(js && css){
			let pruning = cssPruning(js, css);
			io.sockets.emit('cssRedundancies', pruning);
		}
	}


	async function saveCssFile(obj){
		let parts = obj.name.split('src');
		let newPath = newBase + parts[1];
		fs.writeFile(newPath, obj.value, (err) => {
			let cssSize = calcFileSize(newPath);
			
			io.sockets.emit('fileSizeCssNew',{
				filePath: obj.name,
				newSize: cssSize
			});
			setTimeout(() => {
				io.sockets.emit('cssFileSaved', {
					fileName: obj.name,
					status: 'success'
				});	
			}, 400);
		})
	}

	async function saveJsFile(obj){
		let parts = obj.name.split('src');
		let newPath = newBase + parts[1];

		fs.writeFile(newPath, obj.value, (err) => {
			let jsSize = calcFileSize(newPath);
			io.sockets.emit('fileSizeJsNew',{
				filePath: obj.name,
				newSize: jsSize
			});
			setTimeout(() => {
				io.sockets.emit('jsFileSaved', {
					fileName: obj.name,
					status: 'success'
				});
			}, 400);
			
		})
	}


	async function getAllDependentFiles(fileName){
		let dep = await returnAllDependencies(fileName);
		io.sockets.emit('allDependencies', dep);
	}

	async function findClassInSrc(d){
		let jsX = d.jsPaneContent, cssC = d.cssPaneContent, className = d.className;
		let linesInJSX = findLineNumbersForClassInJs(className, jsX);
		let linesInCss = await findClassLineNumbersInCss(cssC, className);
		//console.log(linesInCss);
		io.sockets.emit('classnameLines', { linesInJSX, linesInCss, className });
	}
}
