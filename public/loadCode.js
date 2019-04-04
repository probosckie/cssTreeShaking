'use strict';

let socket, editor, editorCss, jsPath, cssPath;

let unusedClassLines, emptyClassLines;

window.onload = function() {
  socket = io.connect('http://localhost:3000');
  socket.on('fileSourceJs', createEditorWindowJs);
  socket.on('fileSourceCss', createEditorWindowCss)
  socket.on('highlightedLines', highlightLines);
  socket.on('setFullPathJs', setJsFilePath);
  socket.on('setFullPathCss', setCssFilePath);
  socket.on('unusedClassesCss', handleUnusedClasses);
  socket.on('emptyClassesCss', handleEmptyClasses);
  socket.on('cssFileSaved', showSavedMessage)


  
  const fetchSourceBtn = document.querySelector('.fetchSourceCode');
  fetchSourceBtn.addEventListener('click', (e) => {
  	const filePath = document.querySelector('.jsfileNameFetch').value;
  	let data = {
  		filePath
  	};
  	sendData('fetchFileSourceJs', data);
  });

  const highlightBtn = document.querySelector('.highlightSourceCode');
  highlightBtn.addEventListener('click', (e) => {
    const filePath = document.querySelector('.jsfileNameFetch').value;
    let data = {
      filePath
    };
    sendData('highlightFile', data);
  });


  /*const getEditorContent = document.querySelector('.getContent');
  getEditorContent.addEventListener('click', (e) => {
    console.log(editor.getValue());
  })*/


  const fixBtn = document.querySelector('.fixIssues');
  fixBtn.addEventListener('click', (e) => {
    findFixIssuesFromNode();
  });



  const commitBtn = document.querySelector('.commitChanges');
  commitBtn.addEventListener('click', (e) => {
    fixChanges();
  })

}


function sendData(eventName, data) {
  socket.emit(eventName, data);
}


function createEditorWindowJs(data){
	editor = CodeMirror(document.querySelector('#editorJs'), {
		value: data,
    lineNumbers: true,
    mode: "javascript",
    matchBrackets: true
  });
}

function createEditorWindowCss(data){
  editorCss = CodeMirror(document.querySelector('#editorCss'), {
    value: data,
    lineNumbers: true,
    mode: "css",
    matchBrackets: true
  });
}


function highlightLines(data){
  for (let i in data) {
    editor.markText({line: parseInt(i), ch: data[i][0]}, {line: parseInt(i), ch: data[i][1] - 1}, {className: "highlightError"});
  }
}

function setJsFilePath(data){
  const filePath = document.querySelector('.jsfileNameFetch');
  jsPath = data;
  filePath.value = data;
}

function setCssFilePath(data){
  const filePath = document.querySelector('.cssFileName');
  cssPath = data;
  filePath.value = data;
}

function findFixIssuesFromNode() {
  let objectForNode = {
    js: jsPath,
    css: cssPath
  };
  sendData('fixIssues', objectForNode);
}


function handleUnusedClasses(data){
  unusedClassLines = data;
  data.forEach(v => {
    editorCss.markText({line: v, ch: 0}, {line: v, ch: 3}, {className: "color1"});
  });
}

function handleEmptyClasses(data){
  emptyClassLines = data;
  data.forEach(v => {
    editorCss.markText({line: v, ch: 0}, {line: v, ch: 3}, {className: "color2"});
  });
}

function fixChanges() {
  let cssContent = editorCss.getValue();
  let obj = {
    name: cssPath,
    value: cssContent
  }
  sendData('saveCssFile', obj);
}


function showSavedMessage(){
  alert('css file has been saved');
}


