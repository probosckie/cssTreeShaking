'use strict';

let socket, editor, editorCss, jsPath, cssPath;

let classRequestProcessing = false;

let cssBreakdown, classIndex = false, currentClass;

let cssPruneMarkText1 = [], cssPruneMarkText2 = [];
let generalMarkerJS = [], generalMarkerCss = [];
let fileSizeJS = {}, fileSizeCss = {};

let basePath = ''


window.onload = function() {
  socket = io.connect('http://localhost:3051');
  socket.on('fileSourceJs', createEditorWindowJs);
  socket.on('fileSourceCss', createEditorWindowCss)
  socket.on('highlightedLines', highlightLines);
  socket.on('setFullPathJs', setJsFilePath);
  socket.on('setFullPathCss', setCssFilePath);
  socket.on('cssFileSaved', showSavedMessage);
  socket.on('jsFileSaved', showJsSavedMessage);
  socket.on('cssBreakdown', persistBreakDown);
  socket.on('classnameLines', highlightClassLines);
  socket.on('cssRedundancies', startPruning);
  socket.on('fileSizeJs', setJsSize);
  socket.on('fileSizeCss', setCssSize);
  socket.on('fileSizeJsNew', setJsSize2);
  socket.on('fileSizeCssNew', setCssSize2);
  const fetchSourceBtn = document.querySelector('.fetchSourceCode');
  fetchSourceBtn.addEventListener('click', (e) => {
    let filePath = document.querySelector('.jsfileNameFetch').value;
    let rest = '/Users/Prabhas/code/cssTreeShaking/';
    if(filePath.split('/')[0] === 'files')
      filePath = rest + filePath;

    let data = {
      filePath
    };
    sendData('fetchFileSourceJs', data);
  });

  const highlightBtn = document.querySelector('.highlightSourceCode');
  highlightBtn && highlightBtn.addEventListener('click', (e) => {
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
  fixBtn && fixBtn.addEventListener('click', (e) => {
    findFixIssuesFromNode();
  });



  const commitBtn = document.querySelector('.commitChanges');
  commitBtn.addEventListener('click', (e) => {
    fixChanges();
  });


  const cssBreakdownBtn = document.querySelector('.getCssBreakdown');
  cssBreakdownBtn.addEventListener('click', (e) => {
    resetPruningHighlights();
    const jsfilePath = document.querySelector('.jsfileNameFetch').value;
    const cssFilePath = document.querySelector('.cssFileName').value;

    let jsPaneContent = editor.getValue();
    let cssPaneContent = editorCss.getValue();
        

    let data = {
      jsfilePath,
      cssFilePath,
      jsPaneContent,
      cssPaneContent
    };
    sendData('fetchBreakableClassList', data);
  });

  const fetchNextBreakDown = document.querySelector('.startClassFetching');
  fetchNextBreakDown.addEventListener('click', (e) => {
    if(cssBreakdown && classIndex !== false && !classRequestProcessing){
      let info = document.querySelector('.info');
      let cssinfo = document.querySelector('.cssInfo');

      if(cssinfo.textContent){
        cssinfo.textContent= '';
      }

      if(info.textContent){
        info.textContent = '';
      }

      let c = cssBreakdown.modifyClassList[classIndex];
      if(c){
        currentClass = c;
        classIndex++;
        classRequestProcessing = true;
        let jsPaneContent = editor.getValue();
        let cssPaneContent = editorCss.getValue();
        let data = {
          jsPaneContent,
          cssPaneContent,
          className: currentClass
        };
        info.textContent = 'Fetching Next class Line number info';
        sendData('findClassLineNumbers', data);
      } else {
        document.querySelector('.startClassFetching').setAttribute("disabled", true);
      }
    }
  })
}


function sendData(eventName, data) {
  socket.emit(eventName, data);
}


function createEditorWindowJs(data){
  editor = CodeMirror(document.querySelector('#editorJs'), {
    value: data,
    lineNumbers: true,
    mode: "jsx",
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
  let obj = {
    js: editor.getValue(),
    css: editorCss.getValue()
  };
  sendData('fixIssues', obj);
}


function fixChanges() {
  let cssContent = editorCss.getValue();
  let jsContent = editor.getValue();
  let obj = {
    name: cssPath,
    value: cssContent
  }

  let objJs = {
    name: jsPath,
    value: jsContent

  }
  sendData('saveCssFile', obj);
  sendData('saveJsFile', objJs);
}


function showSavedMessage(d){
  let cssinfo = document.querySelector('.cssInfo');
  let obj = fileSizeCss[d.fileName];
  let fileName =  'src/' + d.fileName.split('src')[1];
  let message = `FileName: ${fileName}  Original Size: ${obj.oldSize} characters   New Size: ${obj.newSize} characters`;
  cssinfo.textContent = message;
  editorCss.setValue('');
}


function showJsSavedMessage(d){
  let info = document.querySelector('.info');
  let cssinfo = document.querySelector('.cssInfo');
  let obj = fileSizeJS[d.fileName];
  let fileName =  'src/' + d.fileName.split('src')[1];
  let message = `FileName: ${fileName}  Original Size: ${obj.oldSize} characters   New Size: ${obj.newSize} characters`;
  
  info.textContent = message;
  removeLastHighlights();
  editor.setValue('');
  classRequestProcessing = false;
  classIndex = false;
}


function persistBreakDown(d){
  cssBreakdown = d;
  classIndex = 0;
  document.querySelector('.startClassFetching').removeAttribute("disabled");
}

function markJsLines(arr, label){
  arr.forEach(v => {
    if(label === 'cssPrune'){
      cssPruneMarkText1.push(editor.markText({line: v-1 , ch: 0}, {line: v-1 , ch: 100}, {className: "highlightHurr"}));
    }
    else
      generalMarkerJS.push(editor.markText({line: v-1 , ch: 0}, {line: v-1 , ch: 100}, {className: "highlightHurr"}));
  });
}

function markCssLines(arr, label){
  arr.forEach(v => {
    if(label === 'cssPrune'){
      cssPruneMarkText2.push(editorCss.markText({line: v.start - 1, ch: 0}, {line: v.end, ch: 100}, {className: "highlightHurr"}));
    } else
      generalMarkerCss.push(editorCss.markText({line: v.start - 1, ch: 0}, {line: v.end, ch: 100}, {className: "highlightHurr"}));
  });
}

function startPruning(d){
  let jsContent = '', cssContent = '';
  if(d && d.complexRulesNotUsedJsx){
    cssContent += 'Css - remove classes ->    ';
    d.complexRulesNotUsedJsx.forEach(v => {
      cssContent += ` ${v.selector} -> line: ${v.start} - ${v.end}, `;
    });
  }

  if(d && d.notFoundInCss){
    jsContent += 'JSX - remove classes ->      ';
    d.notFoundInCss.forEach(v => {
      jsContent += ` ${v.className} -> lines: ${v.lines.join(', ')}, `;
    })
  }

  let info = document.querySelector('.info');
  let cssinfo = document.querySelector('.cssInfo');

  if(jsContent)
    info.textContent = jsContent;
  if(cssContent)
    cssinfo.textContent = cssContent;

  let allJsLines = d.notFoundInCss.reduce((a,v) => {a = a.concat(v.lines); return a;}, []);
  let allCssLines = d.complexRulesNotUsedJsx.map(v => ({start:v.start, end: v.end}));

  markJsLines(allJsLines, 'cssPrune');
  markCssLines(allCssLines, 'cssPrune');
}


function resetPruningHighlights(){
  let info = document.querySelector('.info');
  let cssinfo = document.querySelector('.cssInfo');
  info.textContent = '';
  cssinfo.textContent = '';
  cssPruneMarkText1.forEach(v => v.clear());
  cssPruneMarkText2.forEach(v => v.clear());
  cssPruneMarkText1 = [];
  cssPruneMarkText2 = [];
}

function removeLastHighlights(){
  generalMarkerJS.forEach(v => v.clear());
  generalMarkerCss.forEach(v => v.clear());
  generalMarkerJS = [];
  generalMarkerCss = [];
}

function highlightClassLines(d) {
  classRequestProcessing = false;
  removeLastHighlights();
  let info = document.querySelector('.info');
  let cssinfo = document.querySelector('.cssInfo');
  let isReplace = cssBreakdown.replaceClassListHash[d.className];
  let splitBreakDown = cssBreakdown.breakdown['.'+d.className];
  let reducedLineNumbers;
  let content = '', isBase, cssContent = '';
  if(splitBreakDown && splitBreakDown.classes){
    isBase = splitBreakDown.base;
    if(d.linesInJSX && d.linesInJSX.length){
      reducedLineNumbers = d.linesInCss.map(v => {
        return `${v.start} to ${v.end}`;
      }).join(', ');
      if(isReplace){
        content += `JSX class -> ${d.className}: append the class string: "${splitBreakDown.classes.join(' ')}" on line numbers ${d.linesInJSX.join(', ')}   `;
        if(isBase) {
          cssContent += `Css Class -> ${d.className}: - remove all styles apart from ${JSON.stringify(isBase, null,2)} on line numbers: ${reducedLineNumbers}`;
        } else {
          cssContent += `Remove Css class -> ${d.className} body, but dont remove the declaration ->  line numbers: ${reducedLineNumbers}`;
        }
        markJsLines(d.linesInJSX, true);
        markCssLines(d.linesInCss);
      } else {
          if(isBase) {
          content += `JSX class -> ${d.className}: append the class string: "${splitBreakDown.classes.join(' ')}" on line numbers ${d.linesInJSX.join(', ')}   `;
          cssContent += `Css Class -> ${d.className}: - remove all styles apart from ${JSON.stringify(isBase, null,2)} on line numbers: ${reducedLineNumbers}`
          markJsLines(d.linesInJSX, true);
          markCssLines(d.linesInCss);
        } else {
          content += `JSX class -> ${d.className}: replace by "${splitBreakDown.classes.join(' ')}" on line numbers ${d.linesInJSX.join(', ')}     `;
          cssContent += `Remove Css class -> ${d.className} line numbers: ${reducedLineNumbers}`;
          markJsLines(d.linesInJSX, true);
          markCssLines(d.linesInCss);
        }
      }
      
    }  
  }

  if(content)
    info.textContent = content;
  if(cssContent)
    cssinfo.textContent = cssContent;
}


function setJsSize(d){
  fileSizeJS[d.filePath] = {oldSize: d.originalSize};
}

function setJsSize2(d){
  fileSizeJS[d.filePath].newSize = d.newSize;
}

function setCssSize(d){
  fileSizeCss[d.filePath] = {oldSize: d.originalSize};
}

function setCssSize2(d){
  fileSizeCss[d.filePath].newSize = d.newSize;
}
