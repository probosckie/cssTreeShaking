/*
This script will be able to replace direct css and present choices to user via a WS ui.
*/
import fs from "fs";
import path from "path";
import pc from "postcss";
import {
  getContent,
  writeToFile,
  extractAllClasses,
  getAllCssRules,
  isClassPartOfComplexString,
  findLineNumbersForClassInJs
} from "./utils";

let jsFile = "../files/src/components/Bus/BusReviews/index.js";
let cssFile = "../files/src/components/Bus/BusReviews/styles.css";

let cssRuleFile = "../cssResult.json";

jsFile = path.join(__dirname, jsFile);
cssFile = path.join(__dirname, cssFile);
cssRuleFile = path.join(__dirname, cssRuleFile);

let pcTree;

export function isClassNamePresentInSelectorString(className, selectorString) {
  className = "." + className;
  let exactMatchTest = false,
    complexSelectorTest = false;
  let result = {
    exactMatchTest: false,
    complexSelectorTest: false
  };

  for (let v of selectorString.split(",")) {
    exactMatchTest = v.trim() === className;
    complexSelectorTest = isClassnamePartOfComplexSelectorRule(
      className,
      v.trim()
    );
    if (complexSelectorTest) {
      result.complexSelectorTest = true;
    }
    if (exactMatchTest) {
      result.exactMatchTest = true;
    }
  }
  if (!result.exactMatchTest && !result.complexSelectorTest) return false;

  return result;
}

export function isClassnamePartOfComplexSelectorRule(className, selector) {
  let charlastTest, test, match, charStart;

  test = false;

  for (;;) {
    match = selector.indexOf(className);

    if (match == -1) break;

    charlastTest = selector[match + className.length];
    test = isClassPartOfComplexString(charlastTest);

    if (match !== 0) {
      charStart = selector[match - 1];
      if (!charlastTest || test) {
        if (isClassPartOfComplexString(charStart) || !!charStart) {
          test = true;
          break;
        }
      }
    }

    if (test) break;

    selector = selector.substring(match + className.length);

    if (selector === "") break;
  }
  return test;
}

function isMediaQueryBlock(seed) {
  return seed.type === "atrule" && seed.name === "media";
}

function isSassNode(seed) {
  let nodes = seed.nodes,
    test = false;
  if (nodes && nodes.length) {
    nodes.forEach(v => {
      if (v.type === "rule") test = true;
    });
  }
  return test;
}

function returnStyleFromNode(node) {
  let style = {};
  if (node.nodes && node.nodes.length) {
    node.nodes.forEach(v => {
      if (v.type === "decl") style[v.prop] = v.value;
    });
  }
  return style;
}

function recurseFindComplex(c, tree) {
  let isComplex = false,
    isFound = false,
    isMedia = false,
    hasInternalNodes = false;
  let leafLevel = -1;

  function recurseFind(selectorName, seed, isM, level) {
    let isAtRule = isMediaQueryBlock(seed),
      result;
    if (seed.selector) {
      result = isClassNamePresentInSelectorString(selectorName, seed.selector);

      if (result.complexSelectorTest) isComplex = true;

      if (result) {
        isFound = true;

        if (!result.complexSelectorTest && isSassNode(seed))
          hasInternalNodes = true;

        if (isM) isMedia = true;
        if (level > leafLevel) leafLevel = level;
      }
    }

    if (seed.nodes && !isComplex) {
      seed.nodes.forEach(v =>
        recurseFind(selectorName, v, isAtRule || isM, level + 1)
      );
    }
  }
  recurseFind(c, tree, false, 0);

  //if it is a complex selector or in a nested sass or in a media query or not found - then not splittable
  if (isComplex || leafLevel > 1 || isMedia || !isFound) return false;

  if (hasInternalNodes) return "classNameReplace";

  return true;
}

function recurseClassFound(c, tree) {
  let isComplex = false, isFound = false;

  function recurseFind(selectorName, seed) {
    let isAtRule = isMediaQueryBlock(seed),
      result;
    if (seed.selector) {
      result = isClassNamePresentInSelectorString(selectorName, seed.selector);

      if (result.complexSelectorTest) 
        isComplex = true;

      if (result) {
        isFound = true;
      }
    }

    if (seed.nodes && !isComplex && !isFound) {
      seed.nodes.forEach(v =>
        recurseFind(selectorName, v)
      );
    }
  }
  recurseFind(c, tree);

  if(isFound)
    return true;
  else
    return false;
}


export async function processCssBreakdown(jsFile, cssFile, jsContent, cssContent) {
  //let jsContent = await getContent(jsFile);
  let cssClassNames = await getContent(cssRuleFile);
  let test, lines = jsContent.split("\n");
  let classes = extractAllClasses(lines, true, "s");
  if (classes) 
    classes = Object.keys(classes);
  //let cssContent = await getContent(cssFile);
  let rule = pc.parse(cssContent);
  pcTree = rule;
  let modifiedClassList = [],
    classNameReplaceClassList = [];
  for (let i of classes) {
    test = recurseFindComplex(i, pcTree);
    if (test === "classNameReplace") classNameReplaceClassList.push(i);
    else if (test === true) modifiedClassList.push(i);
  }
  let parsedStylesForClasses = [
    ...classNameReplaceClassList,
    ...modifiedClassList
  ].reduce((a, v) => {
    a["." + v] = {};
    return a;
  }, {});
  let styleNodeList = pcTree.nodes.filter(
    v => !isMediaQueryBlock(v) && v.type !== "comment"
  );
  for (let i of styleNodeList) {
    if (i.selector) {
      let present = false,
        x = i.selector.split(",");
      x.forEach(v => {
        if (v in parsedStylesForClasses) {
          parsedStylesForClasses[v] = Object.assign(
            {},
            parsedStylesForClasses[v],
            returnStyleFromNode(i)
          );
        }
      });
    }
  }

  cssClassNames = JSON.parse(cssClassNames);
  let breakdownObject = {};

  for (let i in parsedStylesForClasses) {
    breakdownObject[i] = {};
    let inspectEle = parsedStylesForClasses[i];
    for (let j in inspectEle) {
      let value = inspectEle[j];
      if (j in cssClassNames && value in cssClassNames[j]) {
        if (!breakdownObject[i].classes) breakdownObject[i].classes = [];
        breakdownObject[i].classes.push(cssClassNames[j][value]);
      } else {
        if (!breakdownObject[i].base) breakdownObject[i].base = {};
        breakdownObject[i].base[j] = value;
      }
    }
  }


  modifiedClassList = modifiedClassList.filter(v => {
    let className = `.${v}`;
    //console.log(className);
    let brk = breakdownObject[className];
    //console.log(brk);
    if(Object.keys(brk).length === 1 && Object.keys(brk)[0] === 'base')
      return false;
    else
      return true;
  });


  modifiedClassList = modifiedClassList.concat(classNameReplaceClassList);


  classNameReplaceClassList = classNameReplaceClassList.reduce((a,v) => {a[v] = true; return a;}, {});


  let result22 = {
    breakdown: breakdownObject,
    replaceClassListHash: classNameReplaceClassList,
    modifyClassList: modifiedClassList
  }
  return result22;
}


export function cssPruning(jsContent, cssContent){
  let pcTree = pc.parse(cssContent);
  let notFoundInCss = [];
  let test;
  let i, complexRulesNotUsedJsx = [], newTemp, allClasses;

  allClasses = extractAllClasses(jsContent.split('\n'),true, 's');
  allClasses = Object.keys(allClasses);
    
  //console.log(allClasses);
  let allComplexSelectors = [];

  for (let i of allClasses) {
    test = recurseClassFound(i, pcTree);
    if(!test){
      notFoundInCss.push(i);
    }
  }

  let styleNodeList = pcTree.nodes.filter(
    v => !isMediaQueryBlock(v) && v.type !== "comment"
  );

  styleNodeList.forEach(v => {
    if(v.selector){
      newTemp = v.selector.split(',');
      newTemp = newTemp.map(v1 => {
        return {
          selector: v1,
          start:v.source.start.line,
          end: v.source.end.line
        }
      })
      allComplexSelectors = allComplexSelectors.concat(newTemp);
    }
  });

  allComplexSelectors.forEach(v => {
    let notFoundForAnyRule = false;
    let selectorString = v.selector;
    for(let i of allClasses){
      if(isClassNamePresentInSelectorString(i, selectorString))
        notFoundForAnyRule = true;
    }

    if(!notFoundForAnyRule){
      complexRulesNotUsedJsx.push(v);
    }
  });

  notFoundInCss = notFoundInCss.map(v => {
    let lines = findLineNumbersForClassInJs(v, jsContent);
    return {
      className: v,
      lines
    }
  });

  return {
    notFoundInCss,
    complexRulesNotUsedJsx
  };
}
