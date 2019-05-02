import fs from 'fs';
import path from 'path';
import { returnAllDependencies } from './traverse';
import { getContent, getCssFileName, findCssReferenceObjectName, extractAllClasses, processCss, returnAllDistinctCssProps, getAllCssRules } from './utils';

let pathToDataFile = '../data.json';
let pathToCssDump = '../css.json';
let pathToCrawledFiles = '../fileParsed.json';


pathToDataFile = path.join(__dirname, pathToDataFile); 
pathToCssDump = path.join(__dirname, pathToCssDump)
pathToCrawledFiles = path.join(__dirname, pathToCrawledFiles);

let pathsToSeeds = ['../files/ReviewComp/index.js', 
'../files/index2.js', 
];


function startCrawling(fnPaths) {
	async function x(){
		let allCrawled, anyThingNewToWrite = false, cssDump;
		
		allCrawled = await getContent(pathToCrawledFiles);
		allCrawled = JSON.parse(allCrawled);
		
		cssDump = await getContent(pathToCssDump);
		cssDump = JSON.parse(cssDump);
		
		for(let i of fnPaths){
			let completePath = path.join(__dirname, i);
			if(!(completePath in allCrawled)){
				anyThingNewToWrite = true;
				let fileStructure = await buildWhatWeNeed(completePath);
				for (let v of fileStructure.dependencies){
					if(!(v.js in allCrawled)) {
						await getAllCssRules(v.css, cssDump);
						allCrawled[v.js] = {
							count: 1,
							is_S_used_in_jsx: v.is_S_used_in_jsx
						}
					} else {
						allCrawled[v.js].count = allCrawled[v.js].count + 1;
					}
				}
			}
		}
		if(anyThingNewToWrite){
			writeToFile(pathToCrawledFiles, JSON.stringify(allCrawled));
			writeToFile(pathToCssDump, JSON.stringify(cssDump));
		}
		console.log('completed function successfully');
	}
	x();
}


startCrawling(pathsToSeeds);


async function buildWhatWeNeed(fPath) {
	const result = {
		target_seed: fPath
	};
	const dep = returnAllDependencies(fPath);
	let i, jsPath, content, cssFn, importFound, importedStyleRef, allClasses;

	for(let v of dep){
		jsPath = v.js
		content = await getContent(jsPath);
		cssFn = getCssFileName(v.css);
		importFound =  false;
		content = content.split('\n');
		for(i = 0; !importFound; i++) {
			importFound = content[i].includes(cssFn);
			if(importFound){
				importedStyleRef = findCssReferenceObjectName(content[i])
				v.is_S_used_in_jsx = (importedStyleRef == 's');
			}
		}
		
		allClasses = extractAllClasses(content, v.is_S_used_in_jsx, importedStyleRef);
		v.classNames_used_in_css = allClasses;
		
	}
	result.dependencies = dep;
	return result;
}


function writeToFile(pathToJsFile, data){
	fs.writeFile(pathToJsFile, data, (err) => {
		console.log('the file is overwritten');
	});
}

/*buildWhatWeNeed(pathToJsFile).then(v => {
	writeToFile(pathToDataFile, JSON.stringify(v));
})*/

/*getContent(pathToDataFile).then(v => {
	let dep_list = JSON.parse(v);
	let allProps = {};
	let dep = dep_list.dependencies;

	async function x(){
		for(let i of dep){
			let content = await getContent(i.css);
			returnAllDistinctCssProps(content, allProps);
		}
	}

	x().then(() => {
		writeToFile(pathToCssDump, JSON.stringify(allProps));
	});
});*/




