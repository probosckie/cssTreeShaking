# cssTreeShaking

A project to 
    
    1. statically analyse and prune empty or unused classname declarations from react jsx and styles file
    
    2. create a custom library of global styles
    
    3. automatically remove duplicate style values and replace jsx with global classname


# project structure - target

If you are using React 15 and using withStyles ( https://www.npmjs.com/package/withstyles ) and you have the following file structure:

   componentName
   
      index.js
      
      styles.css
      
      
A single js file - will import only a single style file to wrap styles from and return a HOC from withStyles

  export default withStyles(s)(ComponentName);
  
  

# problems faced in codebase

# empty or unused styles

1. Stylessheets will keep on increasing in size - since no developer will ever delete any style rule. This can cause:

   a. Unused classes  - which are declared in css - but not used in index.js
   
   b. Classes defined in jsx but don't have definition in css 
   
   c. Empty classes in styles.css (which have no body)

# solution to this problem

The nodejs script - server/start.js
 
 can traverse your filesystem from a starting point and find out all such dependent siblings of index.js and styles.css.
There is also a websockets based ui - (starting by script)

npm run server

- which will load this in a UI and highlight all lines which have this problem - and then you can manually delete those lines and commit this change to the actual files.



# redeclaration of common styles - repeated styles increasing the css file size

2. Every developer is creating their own styles in styles.css, since there is no global style availble. Common style and properties are getting repeated and since no developer is aware of what other is writing - common styles are getting repeated.


# solution to this problem

We can crawl the source code and find the common styles by traversing all the css files used in the project


update: server/cssGather.js  - line 15 - variable: pathsToSeeds with a list of entry point containers - 

then run script

npm run gather

 then it will crawl and find all the css styles and distinct property counts from your entire codebase - it will update the file css.json - with this css meta info.

# Next steps

1. Creation of a css file containing common css classes (whose counts are high) - creating a nodejs input/ouput program which will ask for a name of a particular class and then use declare that classs in a file.

You can get the analzed css counts from running - server/cssGather.js - result will be css.json file
You can start creating classnames of global classes - by running - server/createLib.js - this will start an input output program to set names of global classes


2. replacing of style declarations in js files - from s.class (local definition) to a global class string.
 
 
   
   
  

